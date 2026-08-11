import { MachineRepository } from "../repository/machine.repository";
import { CreateMachineDto, UpdateMachineDto } from "../dto/machine.dto";
import { RecordStatus } from "@prisma/client";
import { MachineSearchParams } from "../types/machine.types";
import { websocketService, WEBSOCKET_EVENTS } from "../../websocket";

export class MachineService {
  private repository = new MachineRepository();

  async create(data: CreateMachineDto) {
    const existingCode = await this.repository.findByMachineCode(data.machineCode);
    if (existingCode) {
      throw new Error("Machine code already exists");
    }

    const existingTerminal = await this.repository.findByTerminal(data.terminalId);
    if (existingTerminal) {
      throw new Error("Terminal already assigned to another machine");
    }

    const department = await this.repository.checkDepartmentExists(data.departmentId);
    if (!department) {
      throw new Error("Department does not exist");
    }

    const machineType = await this.repository.checkMachineTypeExists(data.machineTypeId);
    if (!machineType) {
      throw new Error("Machine Type does not exist");
    }

    const terminal = await this.repository.checkTerminalExists(data.terminalId);
    if (!terminal) {
      throw new Error("Terminal does not exist");
    }

    const machine = await this.repository.create(data);
    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_CREATED, machine);
    return machine;
  }

  async getAll(params: any) {
    return await this.repository.findAll(params as MachineSearchParams);
  }

  async getById(id: number) {
    const machine = await this.repository.findById(id);
    if (!machine) {
      throw new Error("Machine not found");
    }
    return machine;
  }

  async update(id: number, data: UpdateMachineDto) {
    const machine = await this.repository.findById(id);
    if (!machine) {
      throw new Error("Machine not found");
    }

    if (data.departmentId && data.departmentId !== machine.departmentId) {
      const department = await this.repository.checkDepartmentExists(data.departmentId);
      if (!department) {
        throw new Error("Department does not exist");
      }
    }

    if (data.machineTypeId && data.machineTypeId !== machine.machineTypeId) {
      const machineType = await this.repository.checkMachineTypeExists(data.machineTypeId);
      if (!machineType) {
        throw new Error("Machine Type does not exist");
      }
    }

    if (data.terminalId && data.terminalId !== machine.terminalId) {
      const existingTerminal = await this.repository.findByTerminal(data.terminalId);
      if (existingTerminal) {
        throw new Error("Terminal already assigned to another machine");
      }
      
      const terminal = await this.repository.checkTerminalExists(data.terminalId);
      if (!terminal) {
        throw new Error("Terminal does not exist");
      }
    }

    const updatedMachine = await this.repository.update(id, data);
    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_UPDATED, updatedMachine);
    return updatedMachine;
  }

  async changeStatus(id: number, status: RecordStatus) {
    const machine = await this.repository.findById(id);
    if (!machine) {
      throw new Error("Machine not found");
    }
    const updatedMachine = await this.repository.changeStatus(id, status);
    
    // Logic Fix: Auto-release active assignments if machine is deactivated
    if (status === 'INACTIVE') {
      const prisma = require("../../../config/prisma").default;
      await prisma.assignment.updateMany({
        where: { machineId: id, status: 'ACTIVE' },
        data: { status: 'COMPLETED', releasedAt: new Date() }
      });
    }

    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_UPDATED, updatedMachine);
    return updatedMachine;
  }

  async assignRoom(id: number, data: { roomId: number | null, rowIndex: number | null, positionIndex: number | null }) {
    const machine = await this.repository.findById(id);
    if (!machine) {
      throw new Error("Machine not found");
    }

    const prisma = require("../../../config/prisma").default;

    if (data.roomId && (!data.rowIndex || !data.positionIndex)) {
      const room = await prisma.room.findUnique({ where: { id: data.roomId } });
      if (room) {
        const count = await prisma.machine.count({ where: { roomId: data.roomId } });
        
        let newRowIndex = Math.floor(count / room.machinesPerRow) + 1;
        let newPosIndex = (count % room.machinesPerRow) + 1;

        let clash = await prisma.machine.findFirst({ where: { roomId: data.roomId, rowIndex: newRowIndex, positionIndex: newPosIndex }});
        while (clash) {
          newPosIndex++;
          if (newPosIndex > room.machinesPerRow) {
            newRowIndex++;
            newPosIndex = 1;
          }
          clash = await prisma.machine.findFirst({ where: { roomId: data.roomId, rowIndex: newRowIndex, positionIndex: newPosIndex }});
        }

        data.rowIndex = newRowIndex;
        data.positionIndex = newPosIndex;

        if (newRowIndex > room.rowsCount) {
          await prisma.room.update({
            where: { id: room.id },
            data: { rowsCount: newRowIndex }
          });
        }
      }
    }

    if (data.roomId && data.rowIndex && data.positionIndex) {
      const clash = await prisma.machine.findFirst({
        where: { roomId: data.roomId, rowIndex: data.rowIndex, positionIndex: data.positionIndex, id: { not: id } }
      });
      if (clash) throw new Error(`Position already occupied by ${clash.machineCode}`);
    }

    const updatedMachine = await this.repository.assignRoom(id, data);
    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_UPDATED, updatedMachine);
    return updatedMachine;
  }
}
