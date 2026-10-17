// Application route path constants
// Centralized to avoid hardcoded strings across the codebase

export const ROUTES = {
  // Public
  LOGIN: "/login",

  // Dashboard
  DASHBOARD: "/",
  DASHBOARD_PROCUREMENT: "/dashboard/procurement",
  DASHBOARD_PRODUCTION: "/dashboard/production",
  DASHBOARD_WAREHOUSE: "/dashboard/warehouse",
  DASHBOARD_DISTRIBUTION: "/dashboard/distribution",
  DASHBOARD_QUALITY: "/dashboard/quality",
  DASHBOARD_SALES: "/dashboard/sales",
  DASHBOARD_WARRANTY: "/dashboard/warranty",

  // Profile
  PROFILE: "/profile",

  // Error
  FORBIDDEN: "/403",

  // Settings & Administration
  SETTINGS: "/settings",
  ADMIN_OVERVIEW: "/administration/overview",
  ADMIN_USERS: "/administration/users",
  ADMIN_ROLES: "/administration/roles",
  ADMIN_PERMISSIONS: "/administration/permissions",
  ADMIN_AUDIT_LOGS: "/administration/audit-logs",
  ADMIN_SECURITY: "/administration/security",
  ADMIN_MODULE_STATUS: "/administration/module-status",
  ADMIN_SYSTEM: "/administration/system",
  USERS: "/administration/users",
  ROLES: "/administration/roles",
  AUDIT_LOGS: "/administration/audit-logs",
  COMPANY: "/settings/company",

  // Product Management
  PRODUCTS: "/products",
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  CATEGORIES: "/products/categories",
  BRANDS: "/products/brands",
  UNITS: "/products/units",

  // Bill of Materials
  BOM: "/bom",
  BOM_DETAIL: (id: string) => `/bom/${id}`,

  // Supplier Management
  SUPPLIERS: "/suppliers",
  SUPPLIER_DETAIL: (id: string) => `/suppliers/${id}`,

  // Supplier Performance & Scorecards (Domain 7)
  SUPPLIER_PERFORMANCE_DASHBOARD: "/suppliers/performance",
  SUPPLIER_PERFORMANCE_LIST: "/suppliers/performance/list",
  SUPPLIER_SCORECARD_DETAIL: (id: string) => `/suppliers/performance/${id}`,
  SUPPLIER_PERFORMANCE_REPORTS: "/suppliers/performance/reports",

  // Logistics & Commercial Documents (Domain 8)
  LOGISTICS_DASHBOARD: "/logistics",
  PACKING_LISTS: "/logistics/packing-lists",
  PACKING_LIST_DETAIL: (id: string) => `/logistics/packing-lists/${id}`,
  DELIVERY_CHALLANS: "/logistics/delivery-challans",
  DELIVERY_CHALLAN_DETAIL: (id: string) => `/logistics/delivery-challans/${id}`,
  SHIPMENT_DOCUMENTS: "/logistics/shipment-documents",
  LOGISTICS_REPORTS: "/logistics/reports",

  // In-App Notifications & Workflow Alerts (Domain 9)
  NOTIFICATIONS: "/notifications",
  NOTIFICATION_PREFERENCES: "/notifications/preferences",

  // Procurement
  PROCUREMENT: "/procurement",
  PURCHASE_REQUESTS: "/procurement/requests",
  PURCHASE_ORDERS: "/procurement/orders",
  GOODS_RECEIPTS: "/procurement/goods-receipts",

  // Inventory
  INVENTORY: "/inventory",
  INVENTORY_STOCK: "/inventory/stock",
  INVENTORY_WAREHOUSES: "/inventory/warehouses",
  INVENTORY_TRANSACTIONS: "/inventory/transactions",
  INVENTORY_TRACEABILITY_LOCATIONS: "/inventory/traceability/locations",
  INVENTORY_TRACEABILITY_BATCHES: "/inventory/traceability/batches",
  INVENTORY_TRACEABILITY_SERIALS: "/inventory/traceability/serials",
  INVENTORY_TRACEABILITY_DAMAGED: "/inventory/traceability/damaged-blocked",
  INVENTORY_TRACEABILITY_TIMELINE: "/inventory/traceability/timeline",
  INVENTORY_TRACEABILITY_REPORTS: "/inventory/traceability/reports",

  // Warehouse (Legacy redirects/aliases)
  WAREHOUSES: "/inventory/warehouses",
  WAREHOUSE_LOCATIONS: "/inventory/traceability/locations",
  STOCK_MOVEMENTS: "/inventory/transactions",

  // Production
  PRODUCTION_PLANS: "/production",
  PRODUCTION_PLAN_DETAIL: (id: string) => `/production/${id}`,
  PRODUCTION_ORDERS: "/production/orders",
  PRODUCTION_ORDER_DETAIL: (id: string) => `/production/orders/${id}`,
  PRODUCTION_EXECUTIONS: "/production/executions",
  PRODUCTION_EXECUTION_DETAIL: (id: string) => `/production/executions/${id}`,
  PRODUCTION_WORK_CENTERS: "/production/work-centers",
  PRODUCTION_MACHINES: "/production/machines",
  PRODUCTION_ROUTINGS: "/production/routings",
  PRODUCTION_WORKER_ASSIGNMENTS: "/production/worker-assignments",
  PRODUCTION_SCHEDULES: "/production/schedules",
  PRODUCTION_EVENTS: "/production/events",
  PRODUCTION_OPERATIONS_REPORTS: "/production/operations-reports",

  // Quality Control & Compliance (Domain 5)
  QUALITY: "/quality",
  QUALITY_DETAIL: (id: string) => `/quality/${id}`,
  QUALITY_NCRS: "/quality-compliance/ncrs",
  QUALITY_NCR_DETAIL: (id: string) => `/quality-compliance/ncrs/${id}`,
  QUALITY_CAPAS: "/quality-compliance/capas",
  QUALITY_DISPOSITIONS: "/quality-compliance/dispositions",
  QUALITY_REWORK: "/quality-compliance/rework",
  QUALITY_SCRAP: "/quality-compliance/scrap",
  QUALITY_COMPLIANCE_REPORTS: "/quality-compliance/reports",

  // Sales
  DISTRIBUTORS: "/distributors",
  SALES_ORDERS: "/sales/orders",

  // Distribution
  SHIPMENTS: "/distribution",

  // Warranty
  WARRANTY: "/warranty",
  SERVICE_REQUESTS: "/warranty/service-requests",

  // Reports
  REPORTS: "/reports",

  // Finance & Accounting
  FINANCE_DASHBOARD: "/finance",
  FINANCE_CUSTOMER_INVOICES: "/finance/customer-invoices",
  FINANCE_SUPPLIER_INVOICES: "/finance/supplier-invoices",
  FINANCE_PAYMENTS: "/finance/payments",
  FINANCE_ACCOUNTS_PAYABLE: "/finance/accounts-payable",
  FINANCE_ACCOUNTS_RECEIVABLE: "/finance/accounts-receivable",
  FINANCE_CHART_OF_ACCOUNTS: "/finance/chart-of-accounts",
  FINANCE_JOURNALS: "/finance/journals",

  // HR & Workforce Management
  HR_DASHBOARD: "/hr",
  HR_DEPARTMENTS: "/hr/departments",
  HR_EMPLOYEES: "/hr/employees",
  HR_ATTENDANCE: "/hr/attendance",
  HR_LEAVE: "/hr/leave",
  HR_PAYROLL: "/hr/payroll",
  // Reverse Logistics & Returns (Domain 6)
  RETURNS_DASHBOARD: "/returns",
  RETURNS_LIST: "/returns/requests",
  RETURN_DETAIL: (id: string) => `/returns/requests/${id}`,
  RETURNS_RMA: "/returns/rmas",
  RETURNS_RECEIPTS: "/returns/receipts",
  RETURNS_DISPOSITIONS: "/returns/dispositions",
  RETURNS_REPAIRS: "/returns/repairs",
  RETURNS_REPLACEMENTS: "/returns/replacements",
  RETURNS_REPORTS: "/returns/reports",
} as const;
