// API endpoint constants
// Routes match the backend controller routes: api/[controller]

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/Auth/login",
    ME: "/Auth/me",
    CHANGE_PASSWORD: "/Auth/change-password",
    GOOGLE_SIGNIN: "/Auth/google-signin",
    LINK_GOOGLE: "/Auth/link-google",
  },

  // Company Management
  COMPANY: {
    BASE: "/Company",
    BY_ID: (id: string) => `/Company/${id}`,
  },

  // User Management
  USER: {
    BASE: "/admin/users",
    BY_ID: (id: string) => `/admin/users/${id}`,
    UPLOAD_AVATAR: (id: string) => `/admin/users/${id}/avatar`,
  },

  // Role Management
  ROLE: {
    BASE: "/admin/roles",
    BY_ID: (id: string) => `/admin/roles/${id}`,
  },

  // Permissions Management
  PERMISSIONS: {
    BASE: "/admin/permissions",
    BY_ROLE_ID: (roleId: string) => `/admin/roles/${roleId}/permissions`,
  },

  // Brands Management
  BRANDS: {
    BASE: "/Brands",
    BY_ID: (id: string) => `/Brands/${id}`,
  },

  // Categories Management
  CATEGORIES: {
    BASE: "/ProductCategories",
    BY_ID: (id: string) => `/ProductCategories/${id}`,
  },

  // Units Management
  UNITS: {
    BASE: "/Units",
    BY_ID: (id: string) => `/Units/${id}`,
  },
  PRODUCTS: {
    BASE: "/Products",
    BY_ID: (id: string) => `/Products/${id}`,
  },
  SUPPLIER_PRODUCTS: {
    BASE: "/supplier-products",
    BY_ID: (id: string) => `/supplier-products/${id}`,
    BY_SUPPLIER: (supplierId: string) => `/supplier-products/supplier/${supplierId}`,
    BY_PRODUCT: (productId: string) => `/supplier-products/product/${productId}`,
  },
  SUPPLIERS: {
    BASE: "/Suppliers",
    BY_ID: (id: string) => `/Suppliers/${id}`,
    ACTIVATE: (id: string) => `/Suppliers/${id}/activate`,
    DEACTIVATE: (id: string) => `/Suppliers/${id}/deactivate`,
  },
  // Future modules — uncomment as backend APIs are completed
  // PRODUCT: {
  //   BASE: "/Product",
  //   BY_ID: (id: string) => `/Product/${id}`,
  // },
  // COMPONENT: {
  //   BASE: "/Component",
  //   BY_ID: (id: string) => `/Component/${id}`,
  // },
  BOM: {
    BASE: "/BOMs",
    BY_ID: (id: string) => `/BOMs/${id}`,
    ACTIVATE: (id: string) => `/BOMs/${id}/activate`,
    DEACTIVATE: (id: string) => `/BOMs/${id}/deactivate`,
  },
  // SUPPLIER: {
  //   BASE: "/Supplier",
  //   BY_ID: (id: string) => `/Supplier/${id}`,
  // PURCHASE_REQUEST: {
  //   BASE: "/PurchaseRequest",
  //   BY_ID: (id: string) => `/PurchaseRequest/${id}`,
  // },
  PURCHASE_ORDERS: {
    BASE: "/PurchaseOrders",
    BY_ID: (id: string) => `/PurchaseOrders/${id}`,
  },
  PURCHASE_REQUESTS: {
    BASE: "/purchase-requests",
    BY_ID: (id: string) => `/purchase-requests/${id}`,
  },
  GOODS_RECEIPTS: {
    BASE: "/GoodsReceipts",
    BY_ID: (id: string) => `/GoodsReceipts/${id}`,
  },
  INVENTORY: {
    BASE: "/Inventory",
    BY_ID: (id: string) => `/Inventory/${id}`,
    BY_PRODUCT: (id: string) => `/Inventory/by-product/${id}`,
    BY_WAREHOUSE: (id: string) => `/Inventory/by-warehouse/${id}`,
    TRANSACTIONS: "/Inventory/transactions",
    TRANSACTIONS_BY_ID: (id: string) => `/Inventory/${id}/transactions`,
    RECEIVE: "/Inventory/receive",
    ISSUE: "/Inventory/issue",
    RESERVE: "/Inventory/reserve",
    RELEASE: "/Inventory/release-reservation",
    ADJUST: "/Inventory/adjust",
    TRANSFER: "/Inventory/transfer",
  },
  WAREHOUSES: {
    BASE: "/Warehouses",
    BY_ID: (id: string) => `/Warehouses/${id}`,
  },
  WAREHOUSE_LOCATIONS: {
    BASE: "/WarehouseLocations",
    BY_ID: (id: string) => `/WarehouseLocations/${id}`,
  },
  PRODUCTION_ORDERS: {
    BASE: "/ProductionOrders",
    BY_ID: (id: string) => `/ProductionOrders/${id}`,
    RELEASE: (id: string) => `/ProductionOrders/${id}/release`,
    START: (id: string) => `/ProductionOrders/${id}/start`,
    COMPLETE: (id: string) => `/ProductionOrders/${id}/complete`,
    CANCEL: (id: string) => `/ProductionOrders/${id}/cancel`,
  },
  PRODUCTION_PLANS: {
    BASE: "/ProductionPlans",
    BY_ID: (id: string) => `/ProductionPlans/${id}`,
    REQUIREMENTS: (id: string) => `/ProductionPlans/${id}/requirements`,
    RELEASE: (id: string) => `/ProductionPlans/${id}/release`,
    GENERATE_PR: (id: string) => `/ProductionPlans/${id}/generate-pr`,
  },
  PRODUCTION_EXECUTIONS: {
    BASE: "/ProductionExecutions",
    BY_ID: (id: string) => `/ProductionExecutions/${id}`,
    START: (id: string) => `/ProductionExecutions/${id}/start`,
    CONSUME: (id: string) => `/ProductionExecutions/${id}/consume`,
    COMPLETE: (id: string) => `/ProductionExecutions/${id}/complete`,
    CANCEL: (id: string) => `/ProductionExecutions/${id}/cancel`,
  },
  // QUALITY: {
  //   BASE: "/Quality",
  //   BY_ID: (id: string) => `/Quality/${id}`,
  // },
  // DISTRIBUTOR: {
  //   BASE: "/Distributor",
  //   BY_ID: (id: string) => `/Distributor/${id}`,
  // },
  // SALES_ORDER: {
  //   BASE: "/SalesOrder",
  //   BY_ID: (id: string) => `/SalesOrder/${id}`,
  // },
  // SHIPMENT: {
  //   BASE: "/Shipment",
  //   BY_ID: (id: string) => `/Shipment/${id}`,
  // },
  // WARRANTY: {
  //   BASE: "/Warranty",
  //   BY_ID: (id: string) => `/Warranty/${id}`,
  // },
  WARRANTIES: {
    BASE: "/Warranties",
    BY_ID: (id: string) => `/Warranties/${id}`,
    CLOSE: (id: string) => `/Warranties/${id}/close`,
  },
  WARRANTY_CLAIMS: {
    BASE: "/WarrantyClaims",
    BY_ID: (id: string) => `/WarrantyClaims/${id}`,
    APPROVE: (id: string) => `/WarrantyClaims/${id}/approve`,
    REJECT: (id: string) => `/WarrantyClaims/${id}/reject`,
    RESOLVE: (id: string) => `/WarrantyClaims/${id}/resolve`,
    CLOSE: (id: string) => `/WarrantyClaims/${id}/close`,
  },
  REPORTS: {
    DASHBOARD: "/Reports/dashboard",
    PROCUREMENT: "/Reports/procurement",
    INVENTORY_SUMMARY: "/Reports/inventory/summary",
    INVENTORY: "/Reports/inventory",
    PRODUCTION: "/Reports/production",
    PRODUCTION_SUMMARY: "/Reports/production/summary",
    QUALITY_SUMMARY: "/Reports/quality/summary",
    SALES: "/Reports/sales",
    SALES_SUMMARY: "/Reports/sales/summary",
    DISTRIBUTION_SUMMARY: "/Reports/distribution/summary",
    WARRANTY_SUMMARY: "/Reports/warranty/summary",
    WARRANTY: "/Reports/warranty",
    AUDIT: "/Reports/audit",
  },
  PRODUCTION_OPERATIONS: {
    WORK_CENTERS: "/ProductionOperations/work-centers",
    WORK_CENTER_BY_ID: (id: string) => `/ProductionOperations/work-centers/${id}`,
    MACHINES: "/ProductionOperations/machines",
    MACHINE_BY_ID: (id: string) => `/ProductionOperations/machines/${id}`,
    ROUTINGS: "/ProductionOperations/routings",
    ROUTING_BY_PRODUCT: (productId: string) => `/ProductionOperations/routings/product/${productId}`,
    ASSIGNMENTS: "/ProductionOperations/assignments",
    ASSIGNMENT_COMPLETE: (id: string) => `/ProductionOperations/assignments/${id}/complete`,
    SCHEDULES: "/ProductionOperations/schedules",
    SCHEDULE_STATUS: (id: string) => `/ProductionOperations/schedules/${id}/status`,
    EVENTS: "/ProductionOperations/events",
    REPORTS_SUMMARY: "/ProductionOperations/reports/summary",
  },
} as const;
