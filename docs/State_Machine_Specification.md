# NovaERP State Machine Specification

This document provides complete specification and documentation for all domain state machines across NovaERP.

---

## 1. Procurement Lifecycle State Machine

```
[Draft (0)] ─────────► [Submitted (1)] ─────────► [Approved (3)]
                             │
                             ▼
                      [Rejected (2)]
                             │
                             ▼
                     [Cancelled (4)]
```

- **Purchase Request States:**
  - `Draft (0)`: Initial request created by Procurement Manager.
  - `Submitted (1)`: Request submitted for management approval.
  - `Approved (3)`: Request approved and eligible for PO conversion.
  - `Rejected (2)`: Request rejected by approver.
  - `Cancelled (4)`: Request cancelled prior to order creation.
- **Enforcement:** Validated in `PurchaseRequestService.cs`. Unapproved requests cannot be converted to Purchase Orders.

---

## 2. Purchase Order State Machine

```
[Draft (0)] ─────────► [Submitted (1)] ─────────► [Approved (2)] ─────────► [Closed (4)]
                             │                        │
                             ▼                        ▼
                      [Rejected (5)]         [PartiallyReceived (3)]
```

- **Purchase Order States:**
  - `Draft (0)`: Purchase Order created referencing an Approved PR.
  - `Submitted (1)`: Order submitted for supplier delivery.
  - `Approved (2)`: Order approved and ready for Goods Receipt.
  - `PartiallyReceived (3)`: Received partial shipment via Goods Receipt.
  - `Closed (4)`: All line item quantities received; PO finalized.
  - `Rejected (5)`: Order rejected during review.

---

## 3. Goods Receipt State Machine

```
[Draft (0)] ─────────► [Completed (1)]
     │
     ▼
[Cancelled (2)]
```

- **Goods Receipt States:**
  - `Draft (0)`: Warehouse Manager creates GRN referencing active PO.
  - `Completed (1)`: Stock received, physical inventory updated via `InventoryMovementService.ReceiveAsync` (MovementType: `GoodsReceipt`).
  - `Cancelled (2)`: Draft GRN cancelled before posting.
- **Enforcement:** Completed GRNs are immutable. Attempting duplicate receipt returns `HTTP 400 Bad Request`.

---

## 4. Production Plan State Machine

```
[Draft (0)] ─────────► [Released (1)] ─────────► [Completed (2)]
     │
     ▼
[Cancelled (3)]
```

- **Production Plan States:**
  - `Draft (0)`: Plan created referencing Product and active BOM.
  - `Released (1)`: Plan released for Production Order generation.
  - `Completed (2)`: All associated orders executed and completed.
  - `Cancelled (3)`: Plan cancelled before release.

---

## 5. Production Order State Machine

```
[Draft (0)] ─────────► [Released (1)] ─────────► [InProgress (2)] ─────────► [Completed (3)]
     │                                                                             │
     ▼                                                                             ▼
[Cancelled (4)]                                                          [Generates Quality Inspection Draft]
```

- **Production Order States:**
  - `Draft (0)`: Order created referencing Released Production Plan.
  - `Released (1)`: Order released; materials reserved.
  - `InProgress (2)`: Production Execution started on shop floor.
  - `Completed (3)`: Order completed; automatically generates `QualityInspection` in `Draft` state.
  - `Cancelled (4)`: Order cancelled.

---

## 6. Production Execution State Machine

```
[Draft (0)] ─────────► [Started (1)] ─────────► [Completed (2)]
     │
     ▼
[Cancelled (3)]
```

- **Production Execution States:**
  - `Draft (0)`: Execution assigned to shop floor work center.
  - `Started (1)`: Component consumption executed (`POST /api/ProductionExecutions/{id}/consume`). Component stock issued via `InventoryMovementService.IssueAsync` (MovementType: `ProductionIssue`).
  - `Completed (2)`: Finished goods produced and queued for Quality Inspection.

---

## 7. Quality Inspection State Machine

```
                                      ┌─────────► [Passed (2)]  ───► (Releases Finished Goods Stock)
                                      │
[Draft (0)] ─────────► [InProgress (1)] ───────► [PartiallyPassed (3)]
     │                                │
     ▼                                └─────────► [Failed (4)]  ───► (Quarantine / Rejected)
[Cancelled (5)]
```

- **Quality Inspection States:**
  - `Draft (0)`: Automatically generated upon Production Execution completion.
  - `InProgress (1)`: Quality Engineer starts inspection.
  - `Passed (2)`: 100% of inspected quantity passed. Invokes `InventoryMovementService.ReceiveAsync` (MovementType: `ProductionReceipt`) releasing FG to saleable inventory.
  - `PartiallyPassed (3)`: Partial pass/reject; passed portion released to stock.
  - `Failed (4)`: Inspected batch rejected; stock quarantined.
  - `Cancelled (5)`: Inspection cancelled.

---

## 8. Sales Order & Inventory Reservation State Machine

```
[Draft (0)] ───► [Submitted (1)] ───► [Approved (2)] ───► [Reserved (3)] ───► [Completed (6)]
                       │
                       ▼
                [Rejected (7)]
```

- **Sales Order States:**
  - `Draft (0)`: Order created by Sales Manager for Distributor.
  - `Submitted (1)`: Order submitted for approval.
  - `Approved (2)`: Order approved and ready for inventory reservation.
  - `Reserved (3)`: Finished goods reserved via `InventoryReservation`. `QuantityReserved` increased; `QuantityAvailable` decreased; `QuantityOnHand` unchanged.
  - `Completed (6)`: Shipment dispatched and delivered.

---

## 9. Distribution & Shipment State Machine

```
[Pending (0)] ─────────► [Dispatched (1)] ─────────► [Delivered (2)]
     │
     ▼
[Cancelled (3)]
```

- **Shipment States:**
  - `Pending (0)`: Warehouse Manager creates shipment referencing Reserved Sales Order.
  - `Dispatched (1)`: Goods dispatched. Invokes `InventoryMovementService.IssueAsync` (MovementType: `SalesIssue`). Decrements `QuantityOnHand` and `QuantityReserved`.
  - `Delivered (2)`: Shipment delivered to distributor destination.
  - `Cancelled (3)`: Shipment cancelled prior to dispatch.
- **Enforcement:** Duplicate dispatch attempt is blocked with `HTTP 400 Bad Request`.

---

## 10. Warranty & Claim State Machine

```
[Pending (0)] ─────────► [UnderReview (1)] ─────────► [Approved (2)] ─────────► [Resolved (4)] ─────────► [Closed (5)]
                               │
                               ▼
                        [Rejected (3)]
```

- **Warranty Claim States:**
  - `Pending (0)`: Claim submitted referencing active Warranty and Serial Number.
  - `UnderReview (1)`: Warranty Executive evaluates claim.
  - `Approved (2)`: Claim approved for service/replacement.
  - `Rejected (3)`: Claim rejected (e.g. expired warranty).
  - `Resolved (4)`: Claim resolution documented.
  - `Closed (5)`: Claim finalized and closed.
