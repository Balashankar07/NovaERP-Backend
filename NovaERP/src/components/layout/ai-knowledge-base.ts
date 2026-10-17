/**
 * NovaERP AI Assistant — Comprehensive Knowledge Base
 * Covers all 7 canonical roles with deep workflow guidance,
 * step-by-step instructions, module insights, and corrective advice.
 *
 * Roles:
 *  1. Super Admin
 *  2. Procurement Manager
 *  3. Production Manager
 *  4. Warehouse Manager
 *  5. Quality Engineer
 *  6. Sales Manager
 *  7. Warranty Executive
 */

export type RoleKey =
  | "super_admin"
  | "procurement_manager"
  | "production_manager"
  | "warehouse_manager"
  | "quality_engineer"
  | "sales_manager"
  | "warranty_executive";

export interface RoleProfile {
  key: RoleKey;
  label: string;
  greeting: string;
  color: string;
  badge: string;
  suggestions: string[];
}

// ─── Role detection ───────────────────────────────────────────────────────────
export function detectRole(roleName?: string): RoleKey {
  const r = (roleName || "").toLowerCase();
  if (r.includes("procurement")) return "procurement_manager";
  if (r.includes("production")) return "production_manager";
  if (r.includes("warehouse")) return "warehouse_manager";
  if (r.includes("quality")) return "quality_engineer";
  if (r.includes("sales")) return "sales_manager";
  if (r.includes("warranty")) return "warranty_executive";
  return "super_admin";
}

// ─── Role Profiles (greeting + contextual quick-action suggestions) ────────────
export const ROLE_PROFILES: Record<RoleKey, RoleProfile> = {
  super_admin: {
    key: "super_admin",
    label: "Super Admin",
    greeting: `Welcome back! As Super Admin, you have full system authority over NovaERP.\n\nYou can manage users, define roles & permissions, monitor all modules, view audit trails, and configure the entire enterprise platform.\n\nWhat do you need help with today?`,
    color: "indigo",
    badge: "🛡️",
    suggestions: [
      "How do I create a new user?",
      "Explain the full order lifecycle",
      "How to assign roles to a user?",
      "Where are the global audit logs?",
      "How to configure department structure?",
    ],
  },
  procurement_manager: {
    key: "procurement_manager",
    label: "Procurement Manager",
    greeting: `Hello, Procurement Manager! 👋\n\nYour workspace in NovaERP covers the full supply chain intake:\n• Purchase Requests (PR) → Purchase Orders (PO)\n• Supplier Management & Performance Scorecards\n• Goods Receipt processing linked to POs\n• Supplier invoice & payment tracking\n\nWhat would you like to work on?`,
    color: "amber",
    badge: "🏭",
    suggestions: [
      "How to create a Purchase Request?",
      "How to approve a PR and convert to PO?",
      "Where to track supplier delivery performance?",
      "How to process a Goods Receipt?",
      "Where is the procurement summary report?",
    ],
  },
  production_manager: {
    key: "production_manager",
    label: "Production Manager",
    greeting: `Welcome, Production Manager! 🔧\n\nYou control the manufacturing core of NovaERP:\n• Bills of Materials (BOM) — design & approval\n• Production Plans & Orders\n• Work Centers, Machines & Routings\n• Material consumption & execution tracking\n• Worker schedules & assignments\n\nWhat's on your production agenda?`,
    color: "blue",
    badge: "⚙️",
    suggestions: [
      "How to create and approve a BOM?",
      "How to release a Production Order?",
      "How to record material consumption?",
      "Where are the production schedules?",
      "How to set up a Work Center?",
    ],
  },
  warehouse_manager: {
    key: "warehouse_manager",
    label: "Warehouse Manager",
    greeting: `Hello, Warehouse Manager! 📦\n\nYou manage the physical flow of goods in NovaERP:\n• Goods Receipt & stock updates from POs\n• Batch & Serial number traceability\n• Inventory adjustments & transfers\n• Damaged, Blocked & Quarantine stock\n• Warehouse location & zone management\n\nWhat do you need to work on today?`,
    color: "orange",
    badge: "🏪",
    suggestions: [
      "How to receive goods from a Purchase Order?",
      "Where to see real-time stock levels?",
      "How to create a batch or serial number?",
      "How to handle damaged or blocked stock?",
      "How to do an inventory adjustment?",
    ],
  },
  quality_engineer: {
    key: "quality_engineer",
    label: "Quality Engineer",
    greeting: `Welcome, Quality Engineer! ✅\n\nYou enforce the quality standards in NovaERP:\n• Quality Inspections (incoming, in-process, final)\n• Non-Conformance Reports (NCR)\n• CAPA (Corrective & Preventive Actions)\n• Rework & Scrap management\n• Quality compliance reports & dispositions\n\nWhat quality workflow can I guide you through?`,
    color: "emerald",
    badge: "🔬",
    suggestions: [
      "How to start a quality inspection?",
      "How to raise an NCR for a failed batch?",
      "What is the CAPA workflow?",
      "How to approve a rework request?",
      "Where to view quality compliance reports?",
    ],
  },
  sales_manager: {
    key: "sales_manager",
    label: "Sales Manager",
    greeting: `Hello, Sales Manager! 💼\n\nYour commercial domain in NovaERP covers:\n• Sales Order creation, approval & reservation\n• Customer shipment & delivery tracking\n• Packing Lists & Delivery Challans\n• Warranty registration for sold products\n• Sales performance reports & revenue insights\n\nWhat can I help you close today?`,
    color: "rose",
    badge: "📈",
    suggestions: [
      "How to create and submit a Sales Order?",
      "How to approve and reserve a Sales Order?",
      "How to create and dispatch a shipment?",
      "How to issue a Packing List or Delivery Challan?",
      "Where are the sales performance reports?",
    ],
  },
  warranty_executive: {
    key: "warranty_executive",
    label: "Warranty Executive",
    greeting: `Welcome, Warranty Executive! 🛡️\n\nYou manage the full after-sales service lifecycle:\n• Warranty registration per product & serial\n• Warranty claim intake & approval/rejection\n• Repair, replacement & resolution tracking\n• Customer return (RMA) management\n• Warranty expiry alerts & service reports\n\nHow can I assist your service operations today?`,
    color: "purple",
    badge: "🔐",
    suggestions: [
      "How to register a product warranty?",
      "How to process a warranty claim?",
      "How to handle a customer return (RMA)?",
      "How to approve or reject a warranty claim?",
      "Where to view warranty expiry reports?",
    ],
  },
};

// ─── Deep Knowledge Base (topic → role-specific answers) ─────────────────────
type Intent = {
  keywords: string[];
  responses: Partial<Record<RoleKey, string>>;
  fallback: string;
};

export const KNOWLEDGE_BASE: Intent[] = [
  // ── Purchase Requests ─────────────────────────────────────────────────────
  {
    keywords: ["purchase request", "pr", "requisition", "create pr", "raise pr"],
    responses: {
      procurement_manager:
        "📋 **Purchase Request (PR) Workflow:**\n1. Go to **Procurement → Purchase Requests** in the sidebar.\n2. Click **Create New Request** and fill in: Product, Quantity, Required By date, and Justification.\n3. Click **Submit** to move the PR to 'Pending Approval'.\n4. Once approved, you can convert it to a Purchase Order directly from the PR detail page.\n\n⚠️ *Tip: Ensure the product exists in the Product Master before creating a PR.*",
      super_admin:
        "📋 **Purchase Requests** are created by the Procurement Manager under **Procurement → Purchase Requests**. As Admin, you have full view, edit, and approval rights. You can also override PR status from the admin panel.",
    },
    fallback:
      "Purchase Requests are created and managed by the **Procurement Manager** under Procurement → Purchase Requests. Contact them to initiate a new request.",
  },

  // ── Purchase Orders ───────────────────────────────────────────────────────
  {
    keywords: ["purchase order", "po", "approve po", "approve order", "convert pr"],
    responses: {
      procurement_manager:
        "📦 **Purchase Order (PO) Workflow:**\n1. Go to **Procurement → Purchase Orders**.\n2. To convert an approved PR → click the PR, then use **'Create PO from PR'** button.\n3. Or create a PO directly by selecting a Supplier, adding line items, and setting delivery terms.\n4. Submit → Approve the PO — this locks the order and notifies the supplier.\n\n✅ *Once a PO is approved, the Warehouse Manager can receive goods against it.*",
      warehouse_manager:
        "📦 Once a **Purchase Order** is approved by the Procurement Manager, you will see it in **Inventory → Goods Receipts** ready for receiving. Click the PO reference and process the goods receipt to update stock.",
      super_admin:
        "📦 POs are managed under **Procurement → Purchase Orders**. As Super Admin, you can view, approve, reject, or cancel any PO regardless of workflow stage.",
    },
    fallback:
      "Purchase Orders are managed by the **Procurement Manager**. They are created from approved Purchase Requests and must be approved before goods can be received.",
  },

  // ── Goods Receipt ─────────────────────────────────────────────────────────
  {
    keywords: ["goods receipt", "grn", "receive goods", "goods received", "gr"],
    responses: {
      warehouse_manager:
        "🚚 **Goods Receipt (GRN) Process:**\n1. Navigate to **Inventory → Goods Receipts**.\n2. Click on the linked **Purchase Order reference** to pre-fill the GRN.\n3. Verify received quantities vs. ordered quantities.\n4. Assign **Batch numbers** or **Serial numbers** to traceable items.\n5. Click **'Receive'** to post the GRN — stock levels will update automatically.\n\n⚠️ *Discrepancies in quantity will create a short-receipt record. Notify the Procurement Manager.*",
      procurement_manager:
        "🚚 After a PO is approved, the **Warehouse Manager** processes the Goods Receipt. You can track GRN status under **Procurement → Purchase Orders → [PO Detail] → Receipts tab**.",
      quality_engineer:
        "🚚 After the GRN is posted, incoming goods may trigger a **Quality Inspection** depending on product configuration. Check **Quality → Inspections** for new incoming inspection requests.",
      super_admin:
        "🚚 Goods Receipts are posted under **Inventory → Goods Receipts**. You can view all receipts, their linked POs, batch assignments, and receipt statuses as Super Admin.",
    },
    fallback:
      "Goods Receipts are processed by the **Warehouse Manager** once a Purchase Order is approved. Navigate to Inventory → Goods Receipts.",
  },

  // ── BOM ───────────────────────────────────────────────────────────────────
  {
    keywords: ["bom", "bill of material", "bill of materials", "product structure", "components list"],
    responses: {
      production_manager:
        "🔩 **Bill of Materials (BOM) Workflow:**\n1. Go to **Products → BOMs** in the sidebar.\n2. Click **Create BOM**, select the Finished Good, and add component lines (products + quantities).\n3. Save as 'Draft'.\n4. Once verified, click **'Approve BOM'** — this is required before you can create a Production Order.\n\n✅ *A BOM can be versioned. Always ensure you use the approved version for production.*",
      super_admin:
        "🔩 BOMs (Bills of Materials) are managed under **Products → BOMs**. As Admin, you can view, edit, approve, or delete any BOM. BOMs must be approved before Production Orders can be created.",
      warehouse_manager:
        "🔩 BOMs define what raw materials are needed for production. When a Production Order is issued, the system will check the BOM and deduct materials from your stock. Ensure stock levels are adequate.",
      quality_engineer:
        "🔩 If a BOM includes components with quality hold status, the production order may be blocked. Check **Quality → Inspections** to clear any pending quality holds on components.",
    },
    fallback:
      "Bills of Materials (BOMs) are created and approved by the **Production Manager** under Products → BOMs. An approved BOM is required before any Production Order can be created.",
  },

  // ── Production Orders ─────────────────────────────────────────────────────
  {
    keywords: ["production order", "manufacturing order", "work order", "release production", "start production"],
    responses: {
      production_manager:
        "⚙️ **Production Order Workflow:**\n1. Go to **Production → Orders**.\n2. Click **Create Order**, select the Finished Good, BOM version, and target quantity.\n3. Set the planned start & end dates and assign to a Work Center.\n4. **Release** the order to issue materials from stock.\n5. **Start** to begin execution — log progress and material consumption.\n6. **Complete** once the finished goods are produced and moved to FG warehouse.\n\n⚠️ *If the BOM is not approved, the order cannot be released.*",
      warehouse_manager:
        "⚙️ When a Production Order is released, you will see a **Material Issue** request in Inventory. Confirm and issue the required raw materials to the production floor. Once production is complete, receive the finished goods into FG stock.",
      quality_engineer:
        "⚙️ Production Orders trigger **in-process quality checkpoints**. Check **Quality → Inspections** for any production-stage inspection requests tied to active orders.",
      super_admin:
        "⚙️ Production Orders are managed under **Production → Orders**. As Admin, you can view, edit, release, complete, or cancel any production order.",
    },
    fallback:
      "Production Orders are created and managed by the **Production Manager** under Production → Orders. An approved BOM is required to create them.",
  },

  // ── Quality Inspection ────────────────────────────────────────────────────
  {
    keywords: ["quality inspection", "inspection", "qc check", "quality check", "pass fail", "inspect"],
    responses: {
      quality_engineer:
        "🔬 **Quality Inspection Workflow:**\n1. Navigate to **Quality → Inspections**.\n2. Open a pending inspection (incoming GRN, in-process, or final).\n3. Record measurements, observations, and upload evidence.\n4. Set the result: **Passed**, **Rework**, or **Rejected**.\n   - **Passed** → goods proceed to next stage.\n   - **Rework** → create a Rework Request (Quality → Rework).\n   - **Rejected** → raise an NCR (Non-Conformance Report).\n5. Click **Complete Inspection** to close it.\n\n⚠️ *Rejected items must have an NCR raised before disposition can be decided.*",
      production_manager:
        "🔬 Quality inspections for your production batches appear in **Quality → Inspections**. If an inspection fails, production may be paused until the Quality Engineer resolves the NCR or rework.",
      warehouse_manager:
        "🔬 Incoming goods linked to a GRN may trigger a quality inspection. Stock will remain in **quarantine status** until the Quality Engineer clears it. Check **Inventory → Stock Overview** for quarantine flags.",
      super_admin:
        "🔬 All quality inspections are tracked under **Quality → Inspections**. You can view, start, complete, or cancel any inspection as Super Admin.",
    },
    fallback:
      "Quality Inspections are managed by the **Quality Engineer** under Quality → Inspections. Items can be Passed, sent for Rework, or Rejected.",
  },

  // ── NCR / Non-Conformance ─────────────────────────────────────────────────
  {
    keywords: ["ncr", "non conformance", "non-conformance", "nonconformance", "defect report"],
    responses: {
      quality_engineer:
        "📋 **NCR (Non-Conformance Report) Workflow:**\n1. Go to **Quality → Compliance → NCR**.\n2. Click **Create NCR**, link it to the failed inspection, and describe the non-conformance.\n3. Assign to the responsible team or person.\n4. Once root cause is determined, initiate a **CAPA** (Corrective & Preventive Action).\n5. Close the NCR after the CAPA is verified and effective.\n\n✅ *All NCRs must have a CAPA linked before they can be closed.*",
    },
    fallback:
      "Non-Conformance Reports (NCRs) are created by the **Quality Engineer** under Quality → Compliance → NCR when an inspection fails.",
  },

  // ── CAPA ──────────────────────────────────────────────────────────────────
  {
    keywords: ["capa", "corrective action", "preventive action", "corrective preventive"],
    responses: {
      quality_engineer:
        "🛠️ **CAPA Workflow:**\n1. Navigate to **Quality → Compliance → CAPA**.\n2. Create a CAPA linked to an open NCR.\n3. Define the root cause analysis, corrective action plan, and responsible owner.\n4. Track implementation status.\n5. **Verify** the CAPA is effective (re-inspection or evidence).\n6. **Close** the CAPA — this automatically allows the linked NCR to be closed.\n\n⚠️ *Unverified CAPAs will block NCR closure.*",
    },
    fallback:
      "CAPA (Corrective & Preventive Actions) are managed by the **Quality Engineer** under Quality → Compliance → CAPA.",
  },

  // ── Inventory / Stock ─────────────────────────────────────────────────────
  {
    keywords: ["stock", "inventory", "stock level", "stock overview", "current stock", "reorder", "material availability"],
    responses: {
      warehouse_manager:
        "📊 **Stock Overview:**\n- Navigate to **Inventory & Warehouse → Stock Overview** for real-time stock levels across all warehouses.\n- **Production Material Availability** shows what is ready for the next Production Order.\n- Use **Inventory → Adjustments** to correct discrepancies.\n- Use **Inventory → Transfers** to move stock between warehouses.\n\n⚠️ *Items below their reorder level appear highlighted in red. Create a Purchase Request to replenish.*",
      production_manager:
        "📊 Check **Inventory & Warehouse → Production Material Availability** to see if all BOM components are available for your next production run before releasing a Production Order.",
      procurement_manager:
        "📊 You can view current stock levels that may drive new purchase needs under **Inventory & Warehouse → Stock Overview**. Low-stock items will appear with a reorder alert.",
      super_admin:
        "📊 Stock levels are managed under **Inventory & Warehouse → Stock Overview**. As Admin, you can view, adjust, and transfer inventory across all warehouses and locations.",
    },
    fallback:
      "Stock levels are managed by the **Warehouse Manager** under Inventory & Warehouse → Stock Overview.",
  },

  // ── Batch / Serial Traceability ────────────────────────────────────────────
  {
    keywords: ["batch", "serial", "traceability", "lot", "batch number", "serial number", "trace"],
    responses: {
      warehouse_manager:
        "🔍 **Batch & Serial Traceability:**\n- Go to **Warehouse → Traceability** to view the complete movement history of a batch or serial number.\n- Batches are assigned during **Goods Receipt** or **Production completion**.\n- Serials are registered under **Warehouse → Serial Numbers**.\n- The Traceability Timeline shows every transaction: receipt → inspection → issue → shipment → customer.\n\n✅ *This is critical for warranty claims and quality recalls.*",
      quality_engineer:
        "🔍 Use **Warehouse → Traceability** to track which batch was inspected, passed/failed, and where it went. This is essential for NCR investigation and product recalls.",
      warranty_executive:
        "🔍 For warranty claims, the **serial number** identifies the specific unit. You can view its full history (production batch, shipment date, customer) via **Warehouse → Traceability**.",
    },
    fallback:
      "Batch & Serial traceability is managed by the **Warehouse Manager** under Warehouse → Traceability.",
  },

  // ── Sales Orders ──────────────────────────────────────────────────────────
  {
    keywords: ["sales order", "so", "customer order", "create order", "sell", "customer"],
    responses: {
      sales_manager:
        "💼 **Sales Order Workflow:**\n1. Go to **Sales → Orders → Create New**.\n2. Select the Customer (Company), add product line items with pricing.\n3. **Submit** the order for approval.\n4. Once approved, **Reserve** stock to lock inventory for this order.\n5. Create a **Shipment** from the approved SO.\n6. Dispatch the shipment — the system generates Packing List & Delivery Challan.\n7. Mark delivery as **Delivered** to close the loop.\n\n✅ *A Reserved SO guarantees stock and prevents it from being allocated to other orders.*",
      warehouse_manager:
        "💼 When a Sales Order is **Reserved**, the stock is locked in inventory. You will see a dispatch request in **Distribution → Shipments** once the order is approved for shipment.",
      super_admin:
        "💼 Sales Orders are managed under **Sales → Orders**. As Admin, you can view, approve, reserve, cancel, or override any SO across all customers.",
    },
    fallback:
      "Sales Orders are created and managed by the **Sales Manager** under Sales → Orders.",
  },

  // ── Shipments ─────────────────────────────────────────────────────────────
  {
    keywords: ["shipment", "dispatch", "delivery", "ship", "courier", "shipping"],
    responses: {
      sales_manager:
        "🚛 **Shipment Workflow:**\n1. From an approved & reserved Sales Order, click **'Create Shipment'**.\n2. Set the carrier, vehicle, and scheduled dispatch date.\n3. Generate the **Packing List** (what's inside) and **Delivery Challan** (legal transport document).\n4. Click **Dispatch** to mark goods as shipped.\n5. Once the customer confirms, click **Delivered**.\n\n📌 Navigate to **Distribution → Shipments** to track all active shipments.",
      warehouse_manager:
        "🚛 Once a shipment is dispatched by the Sales Manager, your stock automatically decreases. You can view outbound shipment history under **Distribution → Shipments**.",
    },
    fallback:
      "Shipments are managed by the **Sales Manager** under Distribution → Shipments after a Sales Order is approved and reserved.",
  },

  // ── Warranty ──────────────────────────────────────────────────────────────
  {
    keywords: ["warranty", "claim", "warranty claim", "service request", "warranty registration", "register warranty"],
    responses: {
      warranty_executive:
        "🛡️ **Warranty Management Workflow:**\n\n**Registration:**\n1. Go to **Warranty → Warranties → Register New**.\n2. Link the Product, Serial Number, Customer, and Sale date.\n3. Set warranty duration and terms.\n\n**Claim Processing:**\n1. Go to **Warranty → Claims → Create New**.\n2. Link the registered warranty and describe the defect.\n3. **Approve** or **Reject** the claim with justification.\n4. If approved, initiate: **Repair**, **Replacement**, or **Refund**.\n5. Track resolution and **Close** the claim once resolved.\n\n⚠️ *Claims on expired warranties must be rejected with proper documentation.*",
      sales_manager:
        "🛡️ After delivery, products can be warranty-registered by the **Warranty Executive** under Warranty → Warranties. Ensure delivery challans are available for reference.",
      super_admin:
        "🛡️ Warranty registrations and claims are managed under **Warranty → Warranties** and **Warranty → Claims**. As Admin, you have full read, write, approve, and close access.",
    },
    fallback:
      "Warranty registrations and claims are managed by the **Warranty Executive** under Warranty → Warranties.",
  },

  // ── Returns / RMA ─────────────────────────────────────────────────────────
  {
    keywords: ["return", "rma", "customer return", "refund", "send back", "reverse logistics"],
    responses: {
      warranty_executive:
        "↩️ **Customer Return (RMA) Workflow:**\n1. Go to **Returns → Create RMA**.\n2. Link to the original Sales Order and the specific items being returned.\n3. Once approved, the customer ships goods back.\n4. **Receive** the returned goods and log their physical condition.\n5. **Inspect** them — then choose disposition:\n   - **Restock** (if good condition)\n   - **Rework** (if repairable)\n   - **Scrap** (if damaged beyond repair)\n6. Issue a replacement or credit note as appropriate.\n\n✅ *All RMAs must be linked to a valid warranty or sales order.*",
      sales_manager:
        "↩️ Customer return requests should be routed to the **Warranty Executive** who will create an RMA under Returns. You can view the return status affecting your sales records.",
    },
    fallback:
      "Customer Returns (RMAs) are processed by the **Warranty Executive** under Returns → Create RMA.",
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    keywords: ["invoice", "payment", "finance", "accounts", "payable", "receivable", "ledger", "journal"],
    responses: {
      super_admin:
        "💰 **Finance Module Overview:**\n- **Invoices:** Finance → Invoices — create, approve, and cancel supplier/customer invoices.\n- **Payments:** Finance → Payments — record and approve payments against invoices.\n- **Accounts Payable:** Outstanding amounts owed to suppliers.\n- **Accounts Receivable:** Outstanding amounts owed by customers.\n- **General Ledger:** Finance → General Ledger — view all posted journal entries.\n- **Chart of Accounts:** Finance → Chart of Accounts — manage account structure.\n\n✅ *All financial transactions are double-entry and audit-trailed.*",
      sales_manager:
        "💰 After a shipment is delivered, a **Sales Invoice** can be generated under **Finance → Invoices**. This is managed by the Finance team. You can view your SO's billing status from the Sales Order detail page.",
      procurement_manager:
        "💰 **Supplier Invoices** are created after goods are received (GRN). They are processed under **Finance → Invoices**. As Procurement Manager, you can verify the invoice against your PO.",
    },
    fallback:
      "Finance operations (invoices, payments, ledger) are managed under the Finance module. Contact your Finance team or Super Admin for access.",
  },

  // ── HR ────────────────────────────────────────────────────────────────────
  {
    keywords: ["employee", "hr", "payroll", "leave", "attendance", "department", "workforce"],
    responses: {
      super_admin:
        "👥 **HR Module Overview:**\n- **Employees:** HR → Employees — create and manage employee records, departments, and designations.\n- **Attendance:** HR → Attendance — log and track daily attendance.\n- **Leave:** HR → Leave Management — submit, approve, or reject leave requests.\n- **Payroll:** HR → Payroll — create payroll periods, process and approve salary payments.\n- **Departments:** Pre-configured: Administration, Engineering, Logistics, QA, Sales, Finance, HR.\n\n✅ *Employees must be linked to a department before payroll can be processed.*",
      warehouse_manager:
        "👥 Worker assignments to production or warehouse shifts are managed under **Production Operations → Worker Assignments** and **HR → Attendance**.",
    },
    fallback:
      "HR operations (employees, leave, payroll) are managed under the HR module, typically accessible to Super Admin.",
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  {
    keywords: ["report", "dashboard", "analytics", "insight", "summary", "kpi", "metrics"],
    responses: {
      super_admin:
        "📈 **Reports & Analytics:**\n- **Enterprise Dashboard** — real-time KPIs across all modules.\n- **Reports → Inventory** — stock levels, slow-movers, valuation.\n- **Reports → Production** — order completion rates, efficiency.\n- **Reports → Sales** — revenue, top customers, delivery performance.\n- **Reports → Warranty** — claim rates, resolution times.\n- **Administration → Audit Logs** — full user activity audit trail.\n\n✅ *Role-specific reports are visible only if your role has the relevant permission.*",
      procurement_manager:
        "📈 Your performance reports are under **Reports → Procurement** — view PO fulfillment rates, supplier delivery, and spending analysis. Also check **Supplier Performance** for scorecards.",
      production_manager:
        "📈 Production analytics are under **Reports → Production** — view order completion, material consumption efficiency, and downtime events.",
      warehouse_manager:
        "📈 Inventory reports including stock valuation, slow-movers, and traceability reports are under **Reports → Inventory** and **Warehouse → Reports**.",
      quality_engineer:
        "📈 Quality compliance reports including NCR rates, CAPA effectiveness, and inspection pass/fail ratios are under **Quality → Compliance → Reports**.",
      sales_manager:
        "📈 Sales performance data including revenue, top products, and shipment tracking are under **Reports → Sales**.",
      warranty_executive:
        "📈 Warranty analytics including claim rates, resolution times, and expiry alerts are under **Warranty → Reports** and **Reports → Warranty**.",
    },
    fallback:
      "Reports are available under the Reports module. Access depends on your role permissions.",
  },

  // ── Users & Roles ─────────────────────────────────────────────────────────
  {
    keywords: ["user", "role", "permission", "access", "assign role", "create user", "rbac"],
    responses: {
      super_admin:
        "🔐 **User & Role Management:**\n\n**Create a User:**\n1. Administration → Users → Create New\n2. Enter name, email, password, and assign to a company/branch.\n3. Assign role(s) — multiple roles can be assigned.\n\n**Configure Roles:**\n1. Administration → Roles\n2. Select a role to view/edit its permission matrix.\n3. Toggle individual permissions (View, Create, Edit, Delete, Approve, etc.) per module.\n\n**Available Roles:**\n• Super Admin | Procurement Manager | Production Manager\n• Warehouse Manager | Quality Engineer | Sales Manager | Warranty Executive\n\n✅ *Permission changes take effect on the user's next login.*",
    },
    fallback:
      "Only **Super Admin** can create users and assign roles. Go to Administration → Users and Administration → Roles.",
  },

  // ── Supplier Performance ──────────────────────────────────────────────────
  {
    keywords: ["supplier performance", "scorecard", "supplier rating", "vendor performance", "supplier score"],
    responses: {
      procurement_manager:
        "📊 **Supplier Performance Dashboard:**\n1. Navigate to **Supplier Performance** in the sidebar.\n2. View scorecards showing: On-time delivery rate, Quality pass rate, Order fulfillment accuracy, and Response time.\n3. Each supplier gets an automated score based on historical POs and GRNs.\n4. Use **Configure Weights** to adjust scoring criteria importance.\n\n✅ *Use scorecards during supplier reviews and negotiation cycles.*",
      super_admin:
        "📊 Supplier performance scorecards and analytics are available under **Supplier Performance**. As Admin, you can also configure the scorecard weight rules.",
    },
    fallback:
      "Supplier Performance scorecards are managed by the **Procurement Manager** under Supplier Performance in the sidebar.",
  },

  // ── Work Centers / Machines ───────────────────────────────────────────────
  {
    keywords: ["work center", "machine", "equipment", "routing", "workcenter", "workstation"],
    responses: {
      production_manager:
        "🏭 **Work Centers & Machines:**\n1. Go to **Production Operations → Work Centers** to create and manage work stations.\n2. Each Work Center can have assigned **Machines/Equipment** under Production Operations → Machines.\n3. Define **Routings** — the sequence of operations a product goes through.\n4. Assign workers to shifts via **Production Operations → Worker Assignments**.\n\n✅ *Routings must be linked to Production Orders to enable step-by-step execution tracking.*",
    },
    fallback:
      "Work Centers and Machines are configured by the **Production Manager** under Production Operations.",
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  {
    keywords: ["audit", "audit log", "audit trail", "activity log", "who changed", "history"],
    responses: {
      super_admin:
        "🔍 **Audit Logs:**\n- Go to **Administration → Audit Logs** for the complete system-wide activity trail.\n- Filter by User, Module, Date Range, or Action type.\n- Every Create, Update, Delete, Approve, and Reject action is logged with the user, timestamp, old value, and new value.\n\n✅ *Your personal activity is also visible in Profile → My Activity.*",
    },
    fallback:
      "System-wide Audit Logs are accessible only to **Super Admin** under Administration → Audit Logs. Personal activity is visible to all users under Profile → My Activity.",
  },

  // ── Profile / Personal ────────────────────────────────────────────────────
  {
    keywords: ["profile", "my profile", "account", "password", "personal info", "activity", "my activity"],
    responses: {
      super_admin:
        "👤 Your profile is accessible by clicking your avatar in the top-right → **My Profile**. Here you can update personal information, change your password, view your recent activity, manage notification preferences, and check your assigned permissions.",
      procurement_manager:
        "👤 Click your avatar → **My Profile** to view your account details, update personal information, change your password, and see your recent procurement activity under My Activity.",
      production_manager:
        "👤 Click your avatar → **My Profile** to manage your account. Your recent production order actions are visible under **Profile → My Activity**.",
      warehouse_manager:
        "👤 Click your avatar → **My Profile** to update your information. Your goods receipts and stock adjustments are tracked under **Profile → My Activity**.",
      quality_engineer:
        "👤 Click your avatar → **My Profile** to manage your account. Your inspection completions and NCR actions are tracked under **Profile → My Activity**.",
      sales_manager:
        "👤 Click your avatar → **My Profile** to manage your account. Your sales order actions and shipments appear under **Profile → My Activity**.",
      warranty_executive:
        "👤 Click your avatar → **My Profile** to manage your account. Your warranty registrations and claim resolutions are tracked under **Profile → My Activity**.",
    },
    fallback:
      "Your profile is accessible by clicking your avatar in the top-right corner. Go to My Profile to view personal information, change your password, and see your activity.",
  },

  // ── Order Lifecycle ────────────────────────────────────────────────────────
  {
    keywords: ["lifecycle", "full process", "end to end", "flow", "workflow overview", "process overview"],
    responses: {
      super_admin:
        "🔄 **NovaERP Full Business Lifecycle:**\n\n1️⃣ **Procurement:** PR → PO → Goods Receipt\n2️⃣ **Inventory:** Stock update, Batch/Serial assignment\n3️⃣ **Quality:** Incoming inspection (Pass/Rework/Reject)\n4️⃣ **Production:** BOM → Production Plan → Production Order → Material Issue → Execution → FG stock\n5️⃣ **Quality:** In-process & Final inspection\n6️⃣ **Sales:** Sales Order → Reserve → Shipment → Packing List → Delivery Challan → Delivered\n7️⃣ **Finance:** Invoice generation → Payment recording\n8️⃣ **Warranty:** Registration → Claim → Resolution\n9️⃣ **Returns:** RMA → Receive → Inspect → Disposition\n\n✅ *Every step creates an audit trail linked to the preceding transaction.*",
    },
    fallback:
      "The NovaERP lifecycle flows from Procurement → Inventory → Quality → Production → Sales → Finance → Warranty → Returns. Ask about any specific step for detailed guidance.",
  },
];

// ─── Conversation context (tracks last topic for multi-turn) ─────────────────
export interface ConversationContext {
  lastIntentKeywords: string[];   // keywords from the last matched intent
  lastRole: RoleKey;
  turnCount: number;
}

// ─── Engine: Match user input to an intent ────────────────────────────────────
export function resolveResponse(
  message: string,
  role: RoleKey,
  context?: ConversationContext
): { answer: string; matchedKeywords: string[] } {
  const lower = message.toLowerCase().trim();

  // ── Context continuation: handle follow-up phrases ────────────────────────
  const followUpPhrases = ["what next", "next step", "and then", "after that", "what do i do after", "continue", "then what", "proceed"];
  const isFollowUp = followUpPhrases.some(p => lower.includes(p));

  if (isFollowUp && context && context.lastIntentKeywords.length > 0) {
    // Re-run the last matched intent's answer with a "next step" framing prefix
    const prevKeyword = context.lastIntentKeywords[0];
    const prevIntent = KNOWLEDGE_BASE.find(i => i.keywords.includes(prevKeyword));
    if (prevIntent) {
      const baseAnswer = prevIntent.responses[role] ?? prevIntent.fallback;
      return {
        answer: `**Continuing from your previous question...**\n\n${baseAnswer}`,
        matchedKeywords: context.lastIntentKeywords,
      };
    }
  }

  // ── Score each intent by keyword matches ──────────────────────────────────
  let bestIntent: Intent | null = null;
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const intent of KNOWLEDGE_BASE) {
    let score = 0;
    const matched: string[] = [];
    for (const kw of intent.keywords) {
      if (lower.includes(kw)) {
        score += kw.split(" ").length * 3; // multi-word keywords score higher
        matched.push(kw);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
      bestKeywords = matched;
    }
  }

  if (!bestIntent || bestScore === 0) {
    const tips = ROLE_PROFILES[role].suggestions.map((s) => `• ${s}`).join("\n");
    return {
      answer: `I didn't quite catch that. As a **${ROLE_PROFILES[role].label}**, here's what I can help you with:\n\n${tips}\n\n💡 *Try rephrasing or click a Quick Action below.*`,
      matchedKeywords: [],
    };
  }

  const answer = bestIntent.responses[role] ?? bestIntent.fallback;
  return { answer, matchedKeywords: bestKeywords };
}

