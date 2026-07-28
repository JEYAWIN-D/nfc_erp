# 🏭 NFC Production Dashboard (FactoryOS)

An end-to-end Smart Factory ERP and Real-Time Production Management System built with **React**, **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL**, and **Socket.IO**.

---

## 📌 Table of Contents

- [Overview](#-overview)
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

FactoryOS is designed to monitor live factory floor operations, manage machine assignments, track worker attendance, process production orders, manage bundles, handle quality control (QC), and generate operational analytics in real-time.

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
│   │   ├── modules/         # Feature modules (auth, workers, machines, etc.)
│   │   ├── routes/          # API route definitions
│   │   └── server.ts        # HTTP & WebSocket entry point
│   ├── .env.example         # Template for backend environment variables
│   ├── .gitignore           # Git ignore rules for Backend
│   └── package.json         # Backend dependencies & scripts
│
├── frontend/                # React + Vite Frontend UI
│   ├── src/                 # React components, pages, stores, services
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
