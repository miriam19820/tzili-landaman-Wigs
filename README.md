# WigFlow — Wig Salon Management System

A full-stack web application built for a real wig salon business. WigFlow manages the complete lifecycle of custom wig orders, repair jobs, salon services, quality control, and team coordination — from intake through production, inspection, and delivery.

The UI is in Hebrew (RTL) and is actively used in production by the salon staff.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [User Roles & Access](#user-roles--access)
- [Application Modules](#application-modules)
- [Production Workflow](#production-workflow)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Notifications](#notifications)
- [Business Impact](#business-impact)

---

## Overview

WigFlow replaces paper-based tracking with a centralized digital workflow. Salon staff can:

- Register customers and create new custom wig orders with detailed technical specifications
- Track each wig through a multi-stage production pipeline
- Manage repair jobs with categorized tasks and worker assignment
- Handle wash & style salon services
- Run quality assurance (QA) with approve/reject flows and photo documentation
- Monitor workload and urgency from an admin dashboard
- Search order history by barcode or customer details
- Receive automatic WhatsApp and email notifications on key events

---

## Key Features

| Module | Description |
|--------|-------------|
| **New Wig Orders** | Full order form with measurements, hair specs, pricing, customer signature, and PDF deal summary |
| **Production Station** | Worker-facing view of assigned wigs with stage progression |
| **Repairs** | Diagnosis checklist, task categories (color, machine, hand work, wash, QA), worker allocation |
| **Salon Services** | Wash & style, wash only, or style only orders with drying timer |
| **Quality Control** | Dedicated QA dashboard with approval, rejection, and photo evidence |
| **Admin Dashboard** | Overview table, team management, worker load status, urgency toggles |
| **History Search** | Barcode/QR lookup for full wig history and customer internal notes |
| **Notifications** | WhatsApp alerts to the manager and email summaries with PDF attachments |
| **Authentication** | JWT-based login with role-based route protection |

---

## Tech Stack

### Frontend (`WigFlow-Project/client`)

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Dev server & build tool |
| React Router 7 | Client-side routing |
| Axios | HTTP client |
| React Hook Form | Form handling |
| html2canvas + jsPDF | PDF generation from order forms |
| html5-qrcode | Barcode/QR scanning |

### Backend (`WigFlow-Project/server`)

| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database & ODM |
| JWT + bcryptjs | Authentication & password hashing |
| Nodemailer | Email notifications (Gmail) |
| whatsapp-web.js | WhatsApp notifications |
| Winston | Logging |
| Jest + Supertest | API testing |

---

## Project Structure

```
tzili-landaman-Wigs/
└── WigFlow-Project/
    ├── client/                          # React frontend
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── Auth/                # Login, protected routes
    │   │   │   ├── Dashboard/           # Admin dashboard, team, workload
    │   │   │   ├── History/             # Wig history search
    │   │   │   ├── NewWigs/             # Order form, production station
    │   │   │   ├── Repairs/             # Diagnosis, tasks, customer register
    │   │   │   ├── ServicesAndQA/       # Service orders, QA dashboard
    │   │   │   └── Shared/              # Navbar, layout, buttons, toasts
    │   │   ├── App.tsx                  # Route definitions
    │   │   └── axiosConfig.ts           # API base URL configuration
    │   └── vite.config.ts               # Dev proxy to backend
    │
    └── server/                          # Express backend
        ├── src/
        │   ├── Models_Service/          # Mongoose models & business logic
        │   │   ├── Customer/
        │   │   ├── User/
        │   │   ├── NewWigs/
        │   │   ├── Repairs/
        │   │   └── SalonServices/
        │   ├── Routers/                 # API route handlers
        │   ├── Middlewares/             # Auth, validation, error handling
        │   ├── Services/                # WhatsApp & email notifications
        │   ├── Utils/                   # DB connection, workflow helpers
        │   ├── tests/                   # Jest test suites
        │   ├── app.ts                   # Express app setup
        │   ├── server.ts                # Entry point
        │   └── seed.ts                  # Database seed script
        └── createAdmin.js               # Standalone admin user creation
```

---

## Prerequisites

Before running the project, make sure you have installed:

- **Node.js** v18 or later
- **MongoDB** running locally (default: `mongodb://localhost:27017/wigflow`) or a remote MongoDB URI
- **npm** (comes with Node.js)

Optional (for full notification support):

- A Gmail account with an App Password for email notifications
- A WhatsApp Business phone for scanning the QR code on server startup

---

## Installation

Clone the repository and install dependencies for both the client and server:

```bash
# Install server dependencies
cd WigFlow-Project/server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Environment Variables

Create a `.env` file in `WigFlow-Project/server/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/wigflow

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_secure_secret_key

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# WhatsApp notifications
MANAGER_PHONE=0500000000

# Admin-only destructive actions
ADMIN_DELETE_CODE=your_admin_delete_code
```

> **Note:** Never commit the `.env` file. It is already listed in `.gitignore`.

---

## Running the Application

Start MongoDB, then run the server and client in separate terminals:

```bash
# Terminal 1 — Backend (port 5000)
cd WigFlow-Project/server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd WigFlow-Project/client
npm run dev
```

Open the app at **http://localhost:5173**.

### Seed the Database (Development)

Populate the database with sample users and a test customer:

```bash
cd WigFlow-Project/server
npm run seed
```

Default credentials after seeding:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `password123` | Admin |
| `שרה` | `password123` | Worker (Hair fitting) |
| `ליפשי` | `password123` | Worker (Sewing) |
| `הודיה` | `password123` | Worker (Color) |
| `מירי` | `password123` | Worker (Hand work) |
| `תמי` | `password123` | Worker (Wash) |
| `רחלי` | `password123` | Worker (Quality control) |

> The seed script is blocked in production (`NODE_ENV=production`).

### Production Build

```bash
# Build server
cd WigFlow-Project/server
npm run build
npm start

# Build client
cd WigFlow-Project/client
npm run build
npm run preview
```

---

## User Roles & Access

| Role | Access |
|------|--------|
| **Admin** | Full access: orders, repairs, services, dashboard, history, production, QA |
| **Secretary** | Same navigation as Admin |
| **Worker** | Production station and assigned repair tasks only |
| **QC / Inspector** | Quality control dashboard only |

Workers with a QA-related specialty (e.g. "בקרת איכות") are routed to the QA dashboard instead of the production station.

---

## Application Modules

### New Wig Order (`/`)

Create a custom wig order with:

- Customer lookup or quick registration
- Head measurements (circumference, ear-to-ear, front-to-back)
- Hair type, net size, color, highlights, construction type
- Stage worker assignments and deadlines
- Pricing, advance payment, and customer signature
- PDF deal summary emailed to the salon

### Production Station (`/production`)

Workers see wigs assigned to them and advance orders through production stages.

### Repair Intake (`/repairs/new`)

Register a repair with a diagnosis checklist, categorized sub-tasks, worker allocation, and before/defect photos.

### Salon Service (`/service/new`)

Create wash & style, wash only, or style only service orders linked to a customer.

### QA Dashboard (`/qa`)

Inspectors review items pending quality control. They can approve (with after photo) or reject (with rejection photo and notes, returning items to repair stages).

### Admin Dashboard (`/dashboard`)

- **Team Management** — Create, edit, and delete workers
- **Main Overview Table** — All active new wigs and repairs with urgency flags, delivery, and delete actions
- **Workers Load Status** — Real-time workload per worker

### History Search (`/history`)

Search by wig barcode/QR code to view full production history, linked customer data, and internal notes.

---

## Production Workflow

New wig orders move through the following stages in order:

```
Hair Fitting → Wig Sewing → Color → Hand Work → Wash → QA → Ready for Delivery
(התאמת שיער → תפירת פאה → צבע → עבודת יד → חפיפה → בקרה → מוכנה למסירה)
```

Each stage is automatically assigned to a worker whose specialty matches the stage. Stage transitions trigger WhatsApp notifications to the salon manager.

Repair jobs follow a parallel workflow with categorized tasks:

| Category | Example Sub-tasks |
|----------|-------------------|
| Color | Tones, roots, wash for volume, blonde lightening |
| Machine | Net transfer, lace install, skin flattening, wig shortening |
| Hand Work | Lace fill, ribbon fill, baby hair, height adjustment |
| Wash | Straight, brushed, wavy, curly, natural dry, babyliss |
| QA | Final inspection |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require a `Bearer` token in the `Authorization` header.

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | Public | Authenticate and receive JWT |
| GET | `/` | Admin | List all users |
| POST | `/` | Admin | Create a user |
| PUT | `/:id` | Admin | Update a user |
| DELETE | `/:id` | Admin | Delete a user |
| GET | `/:workerId/unified-tasks` | Token | Get all tasks for a worker |

### Customers — `/api/customers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search/:query` | Token | Search by ID number or name |
| POST | `/` | Token | Create a customer |
| GET | `/` | Admin | List all customers |
| POST | `/:id/notes` | Token | Add internal note |
| DELETE | `/:id/notes/:noteId` | Token | Delete internal note |

### New Wigs — `/api/wigs`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/new` | Admin | Create a new wig order |
| GET | `/` | Admin | List all wigs with workers |
| GET | `/work-station/:workerId` | Worker | Wigs assigned to a worker |
| GET | `/history/:barcode` | Token | Full history by order code |
| PATCH | `/:id/next-step` | Worker | Advance to next production stage |
| PATCH | `/:id/deliver` | Token | Mark as delivered |
| POST | `/send-summary-email` | Token | Email PDF deal summary |
| DELETE | `/:id` | Admin | Delete order (requires admin code) |

### Repairs — `/api/repairs`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create repair order |
| GET | `/dashboard-view` | Admin | Dashboard data |
| GET | `/worker-load` | Admin | Worker workload report |
| GET | `/worker-tasks/:workerId` | Worker | Tasks for a worker |
| PATCH | `/:id/task/:taskIndex` | Worker | Update task status |
| PATCH | `/:id/deliver` | Token | Mark repair as delivered |
| DELETE | `/:id` | Admin | Delete repair (requires admin code) |

### Services — `/api/services`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create service order |
| GET | `/qa-tasks` | QC | List items pending QA |
| PATCH | `/:id/approve` | QC | Approve after inspection |
| PATCH | `/:id/reject` | QC | Reject and return for rework |
| PATCH | `/:id/start-drying` | Worker | Start drying timer |
| PATCH | `/:id/finish-drying` | Worker | Finish drying |
| PATCH | `/:id/finish-styling` | Worker | Complete styling |

---

## Testing

The server includes a Jest test suite covering core business logic:

```bash
cd WigFlow-Project/server
npm test
```

| Test File | Coverage |
|-----------|----------|
| `newWig.test.ts` | New wig order creation and stage progression |
| `repair.test.ts` | Repair order lifecycle and task management |
| `service_qa.test.ts` | Salon services and QA approve/reject flows |
| `e2e_workflow.test.ts` | End-to-end production workflow |
| `edge_cases.test.ts` | Edge cases and error handling |
| `admin_infra.test.ts` | Admin operations and infrastructure |

Tests use a separate database: `mongodb://localhost:27017/wigflow_test`.

---

## Notifications

### WhatsApp

On server startup, a QR code is printed in the terminal. Scan it with the salon's WhatsApp account to enable automatic manager alerts when:

- A wig advances to a new production stage
- A repair is marked as delivered

Session data is stored in `.wwebjs_auth/` (gitignored).

### Email

When a new wig deal is closed, the system can email a PDF summary to the salon's configured Gmail address.

---

## Business Impact

WigFlow is deployed and used daily by a real wig salon. It provides:

- **Visibility** — Managers see all active orders, repairs, and worker loads in one dashboard
- **Accountability** — Every stage transition is logged with timestamps and assigned workers
- **Quality** — QA rejection flow with photo evidence ensures issues are documented and resolved
- **Speed** — Workers receive only their assigned tasks; no searching through paper records
- **Communication** — Automatic WhatsApp alerts keep the manager informed without manual follow-up

---

## License

Private client project. All rights reserved.
