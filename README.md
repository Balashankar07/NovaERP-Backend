# NovaERP — Enterprise Resource Planning System

NovaERP is an enterprise-grade ERP solution built with **ASP.NET Core 8 Web API** and **React + TypeScript + Vite**. It features a modern Clean Architecture backend powered by PostgreSQL, paired with a TanStack Query and Tailwind CSS frontend interface.

---

## 🚀 Technology Stack

### Backend
- **Framework**: ASP.NET Core 8 Web API
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, API, Shared)
- **Database**: PostgreSQL with Entity Framework Core (EF Core)
- **Design Patterns**: CQRS (MediatR), Unit of Work, Repository Pattern, Serilog logging, Swagger UI

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router DOM v6
- **State & Data Fetching**: TanStack Query (React Query)
- **Form Management**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS + shadcn/ui primitives
- **Icons**: Lucide React

---

## 📦 Core Enterprise Modules

1. **Dashboard & Enterprise Analytics**: Cross-module KPI summaries for Procurement, Production, Quality, Inventory, Sales, Warranties, and System Admin.
2. **Product Master Data & BOM**: Comprehensive product catalog, brand governance, categories, units, and multi-level Bill of Materials (BOM).
3. **Supplier & Supplier-Product Management**: Supplier master records, supplier-product linking, MOQ, lead time, and catalog pricing validation.
4. **Procurement Management**: Full lifecycle tracking for Purchase Requests, Purchase Orders, and Goods Receipts (GRN) with stock posting into raw material inventory.
5. **Warehouse & Inventory Management**: Multi-warehouse stock tracking, stock movements (Receive, Issue, Transfer, Adjust), reservations, and immutable inventory transaction ledger.
6. **Production Management**: Production Plans (MRP), Production Orders with material reservation, Production Executions with raw material consumption and automated Quality Inspection creation.
7. **Quality Management & Compliance**: Batch quality inspections (`Draft` $\rightarrow$ `InProgress` $\rightarrow$ `Passed`/`PartiallyPassed`/`Failed`), defect logging (`QualityDefect`), and finished goods inventory release.
8. **Sales & Distribution**: Customer sales orders, finished goods stock reservation, shipment dispatching, and delivery confirmation.
9. **Commercial Warranties & Claims**: Warranty registration on delivery, claim processing, resolution tracking, and claim lifecycle management.
10. **System Administration & Security**: User administration, role management, dynamic Permission Matrix engine, immutable Audit Log tracking (`IAuditLogger`), and company profile configuration.

---

## 🛠️ Getting Started & Setup

### Prerequisites
- .NET 8 SDK
- Node.js (v18+) & npm
- PostgreSQL database

### 1. Backend API Setup
```bash
cd NovaERP.API
dotnet run --urls=http://localhost:5233
```
*API Swagger Documentation is accessible at `http://localhost:5233/swagger`.*

### 2. Frontend Setup
```bash
cd NovaERP
npm install
npm run dev
```
*Frontend interface is accessible at `http://localhost:5173`.*

---

## 🔒 Security & RBAC Boundaries

NovaERP enforces role-based access control (RBAC) across 7 canonical enterprise roles:
1. **Super Admin**: Full administrative, role, permission, user, and enterprise access.
2. **Procurement Manager**: Purchase Requests, Purchase Orders, Goods Receipts, Supplier catalog.
3. **Warehouse Manager**: Inventory stock, warehouse movements, Goods Receipts, shipments.
4. **Production Manager**: Production Plans, Production Orders, Production Executions, material consumption.
5. **Quality Engineer**: Quality inspections, defect logging, finished goods release.
6. **Sales Manager**: Customer sales orders, product catalog, sales reports.
7. **Warranty Executive**: Warranty registrations, claims processing, claim resolution.

*Backend authorization is authoritative via ASP.NET Core `[HasPermission]` attributes and JWT claims.*

---

## 📌 System Boundaries & Limitations

The system honestly documents the following backend-supported boundaries:
- **NCR / CAPA Modules**: `NOT SUPPORTED BY BACKEND` (No Non-Conformance or CAPA entities exist in C# codebase).
- **5-Star Vendor Ratings**: `NOT SUPPORTED BY BACKEND` (Procurement performance is derived from PO/GRN dates).
- **In-App Push Notification Feed**: `NOT SUPPORTED BY BACKEND` (Workflow alerts are handled via entity status properties).

---

## 📄 Build & Quality Verification

- **Build**: `npm run build` passes with **0 TypeScript errors and 0 Vite build errors**.
- **Data Integrity**: **100% real persistent PostgreSQL data** (Zero mock arrays, zero fake fallback numbers).
