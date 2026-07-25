import prisma from "../../../config/prisma";
import { Prisma } from "@prisma/client";
import { AttendanceSearchParams } from "../types/attendance.types";

export class AttendanceRepository {
  async create(data: Prisma.AttendanceUncheckedCreateInput) {
    return prisma.attendance.create({
      data,
      include: {
        worker: true,
        terminal: true,
        machine: true,
        shift: true,
        assignment: true,
      },
    });
  }

  async findAll(params: AttendanceSearchParams) {
    const {
      workerId,
      terminalId,
      machineId,
      shiftId,
      attendanceType,
      status,
      page = 1,
      limit = 10,
      sortBy = "tapTime",
      sortOrder = "desc"
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {
      ...(workerId && { workerId }),
      ...(terminalId && { terminalId }),
      ...(machineId && { machineId }),
      ...(shiftId && { shiftId }),
      ...(attendanceType && { attendanceType }),
      ...(status && { status }),
    };

    const [total, data] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          worker: true,
          terminal: true,
          machine: true,
          shift: true,
        },
      })
    ]);

    return {
      total,
      page,
      limit,
      data
    };
  }

  async findToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.attendance.findMany({
      where: {
        tapTime: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        worker: true,
        terminal: true,
        machine: true,
        shift: true,
      },
      orderBy: {
        tapTime: "desc",
      }
    });
  }

  async findByWorker(workerId: number) {
    return prisma.attendance.findMany({
      where: { workerId },
      include: {
        machine: true,
        shift: true,
        terminal: true,
        assignment: {
          include: {
            operation: true,
          }
        }
      },
      orderBy: { tapTime: "desc" },
    });
  }

  async findCurrentAttendance(workerId: number, shiftId: number) {
    return prisma.attendance.findFirst({
      where: {
        workerId,
        shiftId,
      },
      orderBy: {
        tapTime: "desc",
      }
    });
  }
}
