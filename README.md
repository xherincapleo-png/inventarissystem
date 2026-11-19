# NexusIMS — Enterprise Inventory Management System

A production-ready, multi-warehouse **Inventory Management System** built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **PostgreSQL**, **Prisma ORM**, **Auth.js (NextAuth)**, **React Hook Form + Zod**, **Recharts**, and **Sonner**.

Designed with a clean, enterprise SaaS visual system inspired by Linear, Stripe, and Vercel dashboards.

---

## 1. Key Capabilities & Business Rules

- **Role-Based Access Control (RBAC)**:
  - `SUPER_ADMIN`: Full access across all modules, User & Role Management, and System Settings.
  - `ADMIN`: Manage Products, Categories, Stock In/Out/Adjustments, Suppliers, Warehouses, and Reports.
  - `STAFF`: View Products & Categories, record Stock In and Stock Out, and inspect Stock History.
  - `VIEWER`: Read-only access to Dashboard, Product Catalog, Warehouses, Suppliers, and Reports.
  - *All permissions are strictly enforced on the server inside both Server Components (`enforcePagePermission`) and Server Actions (`requirePermission`).*
- **Atomic Multi-Warehouse Stock Ledger**:
  - Every **Stock In**, **Stock Out**, and **Stock Adjustment** executes inside an interactive Prisma `$transaction`.
  - **Non-Negative Stock Enforcement**: `recordStockOutAction` and `recordStockAdjustmentAction` verify warehouse-specific available stock on the server before committing.
  - **Immutable Audit Trail**: Every stock mutation creates a `StockMovement` record (with previous and new balances) and an `AuditLog` entry.
- **Historical Data Protection (Soft Archiving)**:
  - Products, Suppliers, and Users with historical stock transactions are automatically soft-archived/deactivated rather than hard-deleted, preserving referential integrity across financial and inventory reports.
- **Executive Reports & Multi-Format Exports**:
  - Inventory Status, Stock In, Stock Out, Low Stock Replenishment, and Financial Valuation reports with date-range filtering and one-click export to **CSV**, **Excel (`.xlsx`)**, and **PDF**.

---

## 2. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router, Server Components, Server Actions) |
| **Language** | TypeScript (Strict Mode) |
| **Styling & UI** | Tailwind CSS, `shadcn/ui` primitives, Lucide React icons |
| **Database & ORM** | PostgreSQL + Prisma ORM |
| **Authentication** | Auth.js (`next-auth`) with Credentials Provider & `bcryptjs` |
| **Validation & Forms** | Zod + React Hook Form (`@hookform/resolvers`) |
| **Charts & Analytics** | Recharts |
| **Notifications** | Sonner |
| **Exports** | SheetJS (`xlsx`), `jspdf`, `jspdf-autotable` |

---

## 3. Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory_db?schema=public"

# NextAuth / Auth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-32-byte-secret-with-openssl-rand-base64-32"

# Application Metadata
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="NexusIMS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 4. Setup, Database Migration & Seed Instructions

### Prerequisites
- **Node.js** `>= 18.18.0` (LTS recommended)
- **PostgreSQL** `>= 14` running locally or via cloud provider (Neon, Supabase, Vercel Postgres, Railway)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Generate Prisma Client & Push/Migrate Schema
For development migrations:
```bash
npm run db:generate
npm run db:migrate
```
*(Or push schema directly with `npm run db:push`)*

### Step 3: Seed the Database
Populate roles (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `VIEWER`), demo accounts, warehouses, suppliers, categories, products, and initial stock movements:
```bash
npm run db:seed
```

### Step 4: Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Seeded RBAC Test Accounts

All seeded accounts share the default password: `Password123!` (also available as one-click autofill cards on `/login`):

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **SUPER ADMIN** | `superadmin@nexus-ims.com` | `Password123!` | Full access to all modules, `/users`, and `/settings` |
| **ADMIN** | `admin@nexus-ims.com` | `Password123!` | Products, Categories, Stock In/Out/Adjustments, Suppliers, Warehouses, Reports |
| **STAFF** | `staff@nexus-ims.com` | `Password123!` | View Catalog, Record Stock In & Stock Out, View Stock History |
| **VIEWER** | `viewer@nexus-ims.com` | `Password123!` | Read-only access to Dashboard, Catalog, Warehouses, and Reports |

---

## 6. Available Scripts

- `npm run dev` — Start the Next.js development server with hot reloading.
- `npm run build` — Generate Prisma client and build the production application.
- `npm run start` — Run the compiled production server.
- `npm run typecheck` — Run `tsc --noEmit` to verify strict TypeScript types.
- `npm run lint` — Run Next.js ESLint checks.
- `npm run db:migrate` — Create and apply Prisma PostgreSQL migrations.
- `npm run db:push` — Push Prisma schema state to PostgreSQL.
- `npm run db:seed` — Execute `prisma/seed.ts` to populate initial enterprise data.
- `npm run db:studio` — Open Prisma Studio GUI to inspect database tables.

---

## 7. Deployment on Vercel

1. Push the repository to GitHub / GitLab / Bitbucket.
2. Import the project into **Vercel**.
3. Configure `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in the Vercel Environment Variables settings.
4. Deploy — Vercel automatically runs `npm run build` (`prisma generate && next build`).
