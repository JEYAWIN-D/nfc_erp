# 🏭 NFC Production Dashboard (FactoryOS)

An end-to-end Smart Factory ERP and Real-Time Production Management System built with **React**, **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL**, and **Socket.IO**.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [End-to-End System Workflow](#-end-to-end-system-workflow)
- [Frontend & Backend Modules](#-frontend--backend-modules)
  - [Frontend Modules](#-frontend-modules)
  - [Backend Modules](#-backend-modules)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Environment Configuration (.env Setup)](#2-environment-configuration-env-setup)
  - [3. Backend Setup & Database Migration](#3-backend-setup--database-migration)
  - [4. Frontend Setup](#4-frontend-setup)
- [Running the Application](#-running-the-application)
- [Database Management & Prisma](#-database-management--prisma)
- [Version Control & Git Best Practices](#-version-control--git-best-practices)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Overview

FactoryOS is an integrated Smart Factory ERP & Manufacturing Execution System (MES). It provides real-time monitoring of factory floor operations, tracks worker attendance and shift assignments, manages production orders broken down into bundles, tracks stage-by-stage terminal transactions, monitors machine status via IoT telemetry, logs quality control inspections, and delivers operational analytics.

---

## 🔄 End-to-End System Workflow

```text
[1. Master Setup] ──► [2. Production Orders & Bundles] ──► [3. Worker & Shift Allocation]
                                                                    │
[6. Reports & Analytics] ◄── [5. Quality Control (QC)] ◄── [4. Live Terminal Scan / IoT Telemetry]
```

1. **Master Configuration**: Set up Factory Layout, Departments, Rooms, Machine Types, Machines, Hardware Terminals, and Worker profiles.
2. **Order & Bundle Creation**: Create Production Orders with Target Quantities and Styles; auto-generate Production Bundles with RFID/NFC Tag tracking.
3. **Workforce Allocation**: Clock in workers (Attendance), assign operators to specific Machines and Terminals for each shift.
4. **Floor Execution & IoT Tracking**: Hardware Terminals scan tags at each production operation/stage. Real-time updates stream to the 3D Factory Floor dashboard via Socket.IO.
5. **Quality Control (QC)**: Inspectors audit completed bundles, log pass/fail metrics, defect types, and route items for rework if necessary.
6. **Analytics & Insights**: View live machine utilization, line output, worker productivity metrics, and export summary reports.

---

## 🧩 Frontend & Backend Modules

### 🎨 Frontend Modules

The frontend is built with React 19, Vite, Tailwind CSS, Zustand, and Socket.IO Client.

| Module | Location (`frontend/src/features/`) | Description |
| :--- | :--- | :--- |
| **Dashboard** | `factory/` | Executive overview showing live active orders, output rates, active machines, and active workforce metrics. |
| **Live Factory & 3D Layout** | `factory-layout/` | Interactive 2D/3D visualization of the factory floor layout, room boundaries, machine positioning, and live status indicators. |
| **Production Orders** | `production-order/` | Manage production orders, target quantities, deadlines, and track order completion progress. |
| **Bundles & Tag Workflow** | `bundle/`, `tag-workflow/` | Generate, manage, and track individual production bundles, tag assignments, and stage-by-stage bundle movement. |
| **Machines & Types** | `machine/` | Master management for factory machinery, maintenance status, active operators, and machine type definitions. |
| **Terminals & IoT** | `terminal/`, `iot/`, `iot-demo/` | Terminal station management, IP address mapping, live terminal scan feeds, and simulated IoT sensor metrics. |
| **Departments & Rooms** | `department/` | Organizational unit management, line assignments, and room layout definitions. |
| **Workers & Management** | `worker/`, `user-management/` | Worker profiles, skill levels, employee IDs, and role permissions. |
| **Shift Management** | `shift/` | Define shift schedules (Morning, Evening, Night), shift hours, and active shift rosters. |
| **Worker Assignments** | `assignment/` | Daily allocation matrix mapping workers to specific machines and terminals per shift. |
| **Attendance & Clocking** | `attendance/` | Clock-in / clock-out tracking, daily attendance logs, and workforce presence reports. |
| **Quality Control (QC)** | `qc/` | Inspection checkpoints, logging passed vs. defective units, defect categorization, and rework queue. |
| **Production Planning** | `planning/` | Operational routing, sequence of operations per style/garment, and target cycle times. |
| **Reports & Analytics** | `reports/` | Visual analytics charts, production trends, machine efficiency, and PDF/Excel export tools. |
| **Settings** | `settings/` | Application preferences, theme selection (Dark/Light mode), and API/WebSocket connectivity status. |

---

### ⚙️ Backend Modules

The backend is built with Express, TypeScript, Prisma ORM, Socket.IO, PostgreSQL, Zod, and JWT.

| Module | Location (`Backend/src/modules/`) | Description |
| :--- | :--- | :--- |
| **Auth** | `auth/` | Authentication controller, JWT issuance, password hashing (`bcryptjs`), and permission middleware. |
| **Production Order** | `production-order/` | CRUD operations for production orders, status transitions, and target completion tracking. |
| **Bundle & Stage Log** | `bundle/`, `stage-log/` | Bundle generation, RFID/NFC tag association, and immutable historical logs of every stage completed. |
| **Operation** | `operation/` | Master list of manufacturing operations, standard allowed minutes (SAM), and sequence order. |
| **Machine & Machine Type** | `machine/`, `machine-type/` | Machine inventory APIs, machine status updates (Active, Inactive, Maintenance), and type definitions. |
| **Terminal & IoT** | `terminal/`, `iot/` | Hardware terminal API endpoints for handling barcode/NFC scans, pulse inputs, and IoT sensor payloads. |
| **Department, Room & Floor** | `department/`, `room/`, `floor/` | Structural hierarchy of the physical factory floor for spatial mapping and room analytics. |
| **Worker & Attendance** | `worker/`, `attendance/` | Operator registry, RFID badge verification, attendance clocking, and daily work logs. |
| **Shift & Assignment** | `shift/`, `assignment/` | Shift configuration and worker-to-machine assignment validation logic. |
| **QC Check** | `qc-check/` | Defect tracking API, inspection log storage, and pass/fail/rework calculations. |
| **Dashboard & Reports** | `dashboard/`, `reports/` | Aggregated analytics queries, efficiency calculations, and PDF/Excel generation engines. |
| **WebSocket** | `websocket/` | Central Socket.IO server broadcasting real-time events (`TERMINAL_SCAN`, `MACHINE_STATUS`, `ALERT`). |

---

## 🛠 Tech Stack

### **Backend**
* **Runtime**: Node.js & TypeScript
* **Framework**: Express.js
* **Database**: PostgreSQL (Hosted via Neon DB / Local PostgreSQL)
* **ORM**: Prisma ORM
* **Real-time Engine**: Socket.IO
* **Authentication**: JWT & Bcrypt password hashing
* **Validation**: Zod

### **Frontend**
* **Framework**: React 19 & TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS & Lucide Icons
* **State Management**: Zustand & React Query (TanStack Query)
* **Real-time Client**: Socket.IO Client
* **HTTP Client**: Axios

---

## 📂 Project Architecture

```text
NFC/
├── Backend/                 # Express + Prisma Backend API
│   ├── prisma/              # Prisma schema, migrations, seed scripts
│   ├── src/                 # Application source code
│   │   ├── config/          # Environment configuration
│   │   ├── middleware/      # Auth, error handling, CORS middlewares
│   │   ├── modules/         # 22 Feature modules (auth, workers, bundles, etc.)
│   │   ├── routes/          # API route definitions
│   │   └── server.ts        # HTTP & WebSocket entry point
│   ├── .env.example         # Template for backend environment variables
│   ├── .gitignore           # Git ignore rules for Backend
│   └── package.json         # Backend dependencies & scripts
│
├── frontend/                # React + Vite Frontend UI
│   ├── src/                 # React components, pages, stores, services
│   │   ├── features/        # 21 UI feature modules (factory, bundle, qc, etc.)
│   │   ├── components/      # Reusable UI widgets & design system
│   │   └── services/        # API and Socket services
│   ├── .env.example         # Template for frontend environment variables
│   ├── .gitignore           # Git ignore rules for Frontend
│   └── package.json         # Frontend dependencies & scripts
│
├── .gitignore               # Root level Git ignore configuration
├── erp_schema.sql           # Database schema SQL reference
└── README.md                # Project documentation
```

---

## 📋 Prerequisites

Before running the project, make sure you have installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or higher)
* `npm` (v9.x or higher)
* Access to a PostgreSQL Database (e.g., [Neon DB](https://neon.tech/) or local PostgreSQL server)

---

## ⚡ Quick Start Guide

Follow these step-by-step instructions to get the project running locally on your computer.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd NFC
```

---

### 2. Environment Configuration (.env Setup)

> ⚠️ **Important Security Note**: Real `.env` files containing sensitive database passwords and secrets are **ignored by Git** to prevent leaking credentials. You must create your local `.env` files using the provided `.env.example` templates.

#### **A. Set Up Backend `.env`**

Navigate to the `Backend` folder and create a `.env` file from `.env.example`:

```bash
cd Backend
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux/macOS:
cp .env.example .env
```

Open `Backend/.env` in your editor and fill in your actual database credentials:

```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/nfc_db?sslmode=require"
JWT_SECRET="your_secure_jwt_secret_key"
```

#### **B. Set Up Frontend `.env`**

Navigate to the `frontend` folder and create a `.env` file from `.env.example`:

```bash
cd ../frontend
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux/macOS:
cp .env.example .env
```

Ensure `frontend/.env` points to your local backend server:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

---

### 3. Backend Setup & Database Migration

1. Navigate to the `Backend` directory:
   ```bash
   cd NFC/Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate the Prisma Client:
   ```bash
   npm run prisma:generate
   ```
4. Run Database Migrations (or push schema to database):
   ```bash
   npm run prisma:migrate
   ```
5. Seed initial data (optional but recommended):
   ```bash
   npx tsx prisma/seed.ts
   ```

---

### 4. Frontend Setup

1. Open a new terminal window and navigate to `frontend`:
   ```bash
   cd NFC/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

### **Start the Backend Server**

Run the following command inside `NFC/Backend`:

```bash
npm run dev
```
* The backend API server will start on **http://localhost:5000**.
* Health check endpoint: `http://localhost:5000/health`.

### **Start the Frontend Development Server**

Run the following command inside `NFC/frontend`:

```bash
npm run dev
```
* The frontend web dashboard will start on **http://localhost:5173** (or the port specified in terminal).

---

## 🗄 Database Management & Prisma Commands

Here are useful commands for working with the database inside `NFC/Backend`:

| Command | Description |
| :--- | :--- |
| `npm run prisma:generate` | Generates TypeScript definitions for Prisma Client. |
| `npm run prisma:migrate` | Runs database migrations in development mode. |
| `npm run prisma:studio` | Opens Prisma Studio (interactive web GUI for database data). |
| `npx tsx prisma/seed.ts` | Seeds the database with default test data/users. |
| `npx tsx prisma/create-admin.ts` | Utility script to create an admin account. |

---

## 🔒 Version Control & Git Best Practices

To keep the repository clean and secure when committing and pushing to GitHub:

1. **Never commit `.env` files**: Sensitive keys and passwords belong in `.env`, which is ignored by `.gitignore`.
2. **Always update `.env.example`**: If you add new environment variables, add placeholder names to `.env.example` so teammates know what variables are required.
3. **Build outputs and logs**: Directories like `node_modules/`, `dist/`, and log files (`*.log`) are automatically excluded by `.gitignore`.

---

## ❓ Troubleshooting

#### 1. **Prisma Client Error (`@prisma/client did not initialize...`)**
* **Fix**: Run `npm run prisma:generate` inside `NFC/Backend`.

#### 2. **Database Connection Refused / SSL Error**
* **Fix**: Verify your `DATABASE_URL` in `Backend/.env`. Ensure the database service is running and SSL settings (`?sslmode=require`) match your provider.

#### 3. **CORS Error on Frontend**
* **Fix**: Make sure `VITE_API_URL` in `frontend/.env` matches `http://localhost:5000` (or your backend port) and backend CORS settings allow connection from the frontend origin.

#### 4. **Port 5000 Already in Use**
* **Fix**: Change `PORT=5001` in `Backend/.env` and update `VITE_API_URL` in `frontend/.env` accordingly.

---

🤝 **Maintained by the Engineering Team**
