# NovaERP Clean Architecture & Dependency Specification

This document details the architectural layers, dependency boundaries, data flow rules, and integration contracts enforced throughout NovaERP.

---

## 1. Architectural Layers & Dependency Invariant

NovaERP strictly enforces Clean Architecture dependency rules:

```
┌─────────────────────────────────────────────────────────────┐
│                       NovaERP.API                           │
│     (Controllers, Authorization, Middleware, Swagger)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   NovaERP.Infrastructure                    │
│   (EF Core DbContext, Repositories, Services, BCrypt, JWT)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NovaERP.Application                      │
│     (CQRS/MediatR, DTOs, Service Interfaces, Validators)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      NovaERP.Domain                         │
│           (Entities, Enums, Value Objects, Core Math)        │
└─────────────────────────────────────────────────────────────┘
```

### **Core Dependency Rules:**
1. **`NovaERP.Domain`** contains core enterprise entities, state enums, value objects, and business rules. It has **zero external NuGet or framework dependencies**.
2. **`NovaERP.Application`** contains application interfaces (`IUnitOfWork`, `IInventoryMovementService`, `IQualityInspectionService`), DTO contracts, FluentValidation validators, and CQRS handlers. It depends strictly on `NovaERP.Domain`.
3. **`NovaERP.Infrastructure`** contains database access implementation (`AppDbContext`), EF Core entity configurations, repository implementations, external integrations (BCrypt, Google Auth, JWT), and concrete service logic. It depends on `NovaERP.Application` and `NovaERP.Domain`.
4. **`NovaERP.API`** acts as the presentation entrypoint. It configures Dependency Injection, Serilog logging, CORS, JWT Bearer authentication, and custom `HasPermission` authorization handlers.

---

## 2. Centralized Inventory Engine Pattern

All physical stock manipulations across Procurement, Goods Receipt, Production, Quality Release, and Distribution route through a single authoritative inventory service:

```
Procurement / Goods Receipt ────► GoodsReceiptService ───────┐
                                                            │
Production Material Issue   ────► ProductionExecution ──────┼───► InventoryMovementService ───► AppDbContext (EF Core)
                                                            │     (ReceiveAsync / IssueAsync)
Quality Release (Passed FG) ────► QualityInspection ────────┤
                                                            │
Shipment Dispatch           ────► ShipmentService ──────────┘
```

### **Authoritative Inventory Equations:**
- **Available Stock Equation:**
  $$\text{QuantityAvailable} = \text{QuantityOnHand} - \text{QuantityReserved}$$
- **Stock Movements Ledger:** Every stock alteration appends an immutable `InventoryTransaction` record containing:
  - `ProductId`, `WarehouseId`, `WarehouseLocationId`
  - `TransactionType` (`GoodsReceipt`, `ProductionIssue`, `ProductionReceipt`, `SalesIssue`)
  - `Quantity`, `ResultingBalance`
  - `ReferenceType`, `ReferenceId`

---

## 3. Security & Permission Policy Engine Architecture

```
HTTP Request ──► JwtBearerHandler (Validates Signature & Expiration)
                     │
                     ▼
             Custom PermissionHandler ([HasPermission("Permissions.X.Y")])
                     │
                     ▼
             Queries Database UserRoles ──► RolePermissions ──► Granted Permissions
                     │
                     ▼
             HTTP 200 OK (Allowed) / HTTP 403 Forbidden (Denied)
```

- **Authentication:** Standardized JWT Bearer tokens signed with HMAC-SHA256.
- **Authorization:** Permission claims engine maps fine-grained permission tokens (e.g. `Permissions.SalesOrder.Reserve`) to user roles. Hardcoded role string checks in controllers are strictly prohibited.
- **Password Security:** BCrypt hashing (`BCrypt.Net.BCrypt.HashPassword`) with salt generation. Plaintext passwords are prohibited in database storage and code repositories.
