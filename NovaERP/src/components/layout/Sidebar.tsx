import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes";
import {
  LayoutDashboard,
  Bell,
  Building2,
  Factory,
  Boxes,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  CircleDollarSign,
  Users,
  ShieldCheck,
  FileBarChart,
  BrainCircuit,
  ShieldAlert,
  Settings,
  Cpu,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Truck,
  RotateCcw
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePermissions, getDefaultRouteForUser } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";

interface SidebarNavItem {
  title: string;
  href?: string;
  icon?: any;
  permission?: string | string[];
  children?: {
    title: string;
    href: string;
    permission: string | string[];
  }[];
}

const sidebarNavItems: SidebarNavItem[] = [
  { title: "Enterprise Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard, permission: "Permissions.Dashboard.View" },
  { title: "Notifications", href: ROUTES.NOTIFICATIONS, icon: Bell, permission: "Permissions.Notifications.View" },
  { 
    title: "Production", 
    icon: Factory, 
    children: [
      { title: "Control Center", href: ROUTES.DASHBOARD_PRODUCTION, permission: ["Permissions.ProductionOrders.View", "Permissions.ProductionPlans.View"] },
      { title: "Production Plans", href: ROUTES.PRODUCTION_PLANS, permission: "Permissions.ProductionPlans.View" },
      { title: "Production Orders", href: ROUTES.PRODUCTION_ORDERS, permission: "Permissions.ProductionOrders.View" },
      { title: "Executions", href: ROUTES.PRODUCTION_EXECUTIONS, permission: "Permissions.ProductionExecution.View" },
      { title: "Work Centers", href: ROUTES.PRODUCTION_WORK_CENTERS, permission: "Permissions.Production.WorkCenters.View" },
      { title: "Machines", href: ROUTES.PRODUCTION_MACHINES, permission: "Permissions.Production.Machines.View" },
      { title: "Routings", href: ROUTES.PRODUCTION_ROUTINGS, permission: "Permissions.Production.Routings.View" },
      { title: "Worker Assignments", href: ROUTES.PRODUCTION_WORKER_ASSIGNMENTS, permission: "Permissions.Production.Assignments.View" },
      { title: "Schedules", href: ROUTES.PRODUCTION_SCHEDULES, permission: "Permissions.Production.Schedules.View" },
      { title: "Production Events", href: ROUTES.PRODUCTION_EVENTS, permission: "Permissions.Production.Events.View" },
      { title: "Bill of Materials", href: ROUTES.BOM, permission: "Permissions.BOMs.View" },
      { title: "Production Reports", href: ROUTES.PRODUCTION_OPERATIONS_REPORTS, permission: "Permissions.Production.Reports.View" }
    ]
  },
  { 
    title: "Inventory & Warehouse", 
    icon: Warehouse, 
    children: [
      { title: "Stock Overview", href: ROUTES.INVENTORY_STOCK, permission: "Permissions.Inventory.View" },
      { title: "Production Material Availability", href: ROUTES.INVENTORY, permission: "Permissions.Inventory.View" },
      { title: "Batch / Serial Traceability", href: ROUTES.INVENTORY_TRACEABILITY_TIMELINE, permission: "Permissions.Warehouse.Traceability.View" },
      { title: "Traceability Reports", href: ROUTES.INVENTORY_TRACEABILITY_REPORTS, permission: "Permissions.Warehouse.Reports.View" },
      { title: "Control Center", href: ROUTES.DASHBOARD_WAREHOUSE, permission: ["Permissions.Warehouses.View", "Permissions.Inventory.View"] },
      { title: "Warehouses", href: ROUTES.INVENTORY_WAREHOUSES, permission: "Permissions.Warehouses.View" },
      { title: "Storage Locations", href: ROUTES.INVENTORY_TRACEABILITY_LOCATIONS, permission: "Permissions.WarehouseLocations.View" },
      { title: "Inventory Batches", href: ROUTES.INVENTORY_TRACEABILITY_BATCHES, permission: "Permissions.Warehouse.Batches.View" },
      { title: "Serial Numbers", href: ROUTES.INVENTORY_TRACEABILITY_SERIALS, permission: "Permissions.Warehouse.Serials.View" },
      { title: "Damaged & Blocked", href: ROUTES.INVENTORY_TRACEABILITY_DAMAGED, permission: "Permissions.Warehouse.DamagedStock.View" },
      { title: "Transactions Ledger", href: ROUTES.INVENTORY_TRANSACTIONS, permission: "Permissions.Inventory.Transactions.View" }
    ]
  },
  { 
    title: "Quality Control", 
    icon: ShieldCheck, 
    children: [
      { title: "Control Center", href: ROUTES.DASHBOARD_QUALITY, permission: "Permissions.QualityInspection.View" },
      { title: "Inspections", href: ROUTES.QUALITY, permission: "Permissions.QualityInspection.View" },
      { title: "NCR", href: ROUTES.QUALITY_NCRS, permission: "Permissions.Quality.NCR.View" },
      { title: "CAPA", href: ROUTES.QUALITY_CAPAS, permission: "Permissions.Quality.CAPA.View" },
      { title: "Dispositions", href: ROUTES.QUALITY_DISPOSITIONS, permission: "Permissions.Quality.Disposition.View" },
      { title: "Rework", href: ROUTES.QUALITY_REWORK, permission: "Permissions.Quality.Rework.View" },
      { title: "Scrap", href: ROUTES.QUALITY_SCRAP, permission: "Permissions.Quality.Scrap.View" },
      { title: "Quality Reports", href: ROUTES.QUALITY_COMPLIANCE_REPORTS, permission: "Permissions.Quality.Reports.View" }
    ]
  },
  { 
    title: "Procurement", 
    icon: ShoppingCart, 
    children: [
      { title: "Control Center", href: ROUTES.DASHBOARD_PROCUREMENT, permission: "Permissions.PurchaseOrders.View" },
      { title: "Purchase Orders", href: ROUTES.PURCHASE_ORDERS, permission: "Permissions.PurchaseOrders.View" },
      { title: "Purchase Requests", href: ROUTES.PURCHASE_REQUESTS, permission: "Permissions.PurchaseRequests.View" },
      { title: "Goods Receipts", href: ROUTES.GOODS_RECEIPTS, permission: "Permissions.GoodsReceipts.View" },
      { title: "Suppliers", href: ROUTES.SUPPLIERS, permission: "Permissions.Suppliers.View" },
      { title: "Supplier Performance", href: ROUTES.SUPPLIER_PERFORMANCE_DASHBOARD, permission: "Permissions.SupplierPerformance.View" }
    ]
  },
  { 
    title: "Sales & Fulfillment", 
    icon: TrendingUp, 
    children: [
      { title: "Control Center", href: ROUTES.DASHBOARD_SALES, permission: "Permissions.SalesOrders.View" },
      { title: "Sales Orders", href: ROUTES.SALES_ORDERS, permission: "Permissions.SalesOrders.View" },
      { title: "Shipments", href: "/distribution/shipments", permission: "Permissions.Shipments.View" },
      { title: "Logistics Documents", href: ROUTES.LOGISTICS_DASHBOARD, permission: "Permissions.LogisticsDocuments.View" }
    ]
  },
  { 
    title: "Warranty & Service", 
    icon: ShieldAlert, 
    children: [
      { title: "Control Center", href: ROUTES.DASHBOARD_WARRANTY, permission: "Permissions.Warranties.View" },
      { title: "Warranties List", href: ROUTES.WARRANTY, permission: "Permissions.Warranties.View" }
    ]
  },
  { 
    title: "Returns & Reverse Logistics", 
    icon: RotateCcw, 
    children: [
      { title: "Control Center", href: ROUTES.RETURNS_DASHBOARD, permission: "Permissions.Returns.View" },
      { title: "Customer Returns", href: ROUTES.RETURNS_LIST, permission: "Permissions.Returns.View" },
      { title: "RMA Authorizations", href: ROUTES.RETURNS_RMA, permission: "Permissions.Returns.RMA" },
      { title: "Return Receipts", href: ROUTES.RETURNS_RECEIPTS, permission: "Permissions.Returns.Receive" },
      { title: "Return Dispositions", href: ROUTES.RETURNS_DISPOSITIONS, permission: "Permissions.Returns.Inspect" },
      { title: "Return Repairs", href: ROUTES.RETURNS_REPAIRS, permission: "Permissions.Returns.Repair" },
      { title: "Stock Replacements", href: ROUTES.RETURNS_REPLACEMENTS, permission: "Permissions.Returns.Replace" },
      { title: "Reverse Analytics", href: ROUTES.RETURNS_REPORTS, permission: "Permissions.Returns.Reports" }
    ]
  },
  { 
    title: "Products", 
    icon: Boxes, 
    children: [
      { title: "All Products", href: ROUTES.PRODUCTS, permission: "Permissions.Products.View" },
      { title: "Brands", href: ROUTES.BRANDS, permission: "Permissions.Brands.View" },
      { title: "Categories", href: ROUTES.CATEGORIES, permission: "Permissions.ProductCategories.View" },
      { title: "Units", href: ROUTES.UNITS, permission: "Permissions.Units.View" }
    ]
  },
  { 
    title: "Finance & Accounting", 
    icon: CircleDollarSign, 
    children: [
      { title: "Overview", href: ROUTES.FINANCE_DASHBOARD, permission: "Permissions.Finance.View" },
      { title: "Customer Invoices", href: ROUTES.FINANCE_CUSTOMER_INVOICES, permission: "Permissions.Finance.Invoices.View" },
      { title: "Supplier Invoices", href: ROUTES.FINANCE_SUPPLIER_INVOICES, permission: "Permissions.Finance.Invoices.View" },
      { title: "Payments Ledger", href: ROUTES.FINANCE_PAYMENTS, permission: "Permissions.Finance.Payments.View" },
      { title: "Accounts Payable", href: ROUTES.FINANCE_ACCOUNTS_PAYABLE, permission: "Permissions.Finance.AccountsPayable.View" },
      { title: "Accounts Receivable", href: ROUTES.FINANCE_ACCOUNTS_RECEIVABLE, permission: "Permissions.Finance.AccountsReceivable.View" },
      { title: "Chart of Accounts", href: ROUTES.FINANCE_CHART_OF_ACCOUNTS, permission: "Permissions.Finance.ChartOfAccounts.View" },
      { title: "General Ledger", href: ROUTES.FINANCE_JOURNALS, permission: "Permissions.Finance.GeneralLedger.View" }
    ]
  },
  { 
    title: "HR & Workforce", 
    icon: Users, 
    children: [
      { title: "Overview", href: ROUTES.HR_DASHBOARD, permission: "Permissions.HR.View" },
      { title: "Departments", href: ROUTES.HR_DEPARTMENTS, permission: "Permissions.HR.Departments.View" },
      { title: "Employee Directory", href: ROUTES.HR_EMPLOYEES, permission: "Permissions.HR.Employees.View" },
      { title: "Attendance & Time", href: ROUTES.HR_ATTENDANCE, permission: "Permissions.HR.Attendance.View" },
      { title: "Leave Management", href: ROUTES.HR_LEAVE, permission: "Permissions.HR.Leave.View" },
      { title: "Payroll & Salaries", href: ROUTES.HR_PAYROLL, permission: "Permissions.HR.Payroll.View" },
      { title: "Analytics & Reports", href: ROUTES.HR_REPORTS, permission: "Permissions.HR.Reports.View" }
    ]
  },
  { 
    title: "Administration", 
    icon: Settings, 
    children: [
      { title: "Overview", href: ROUTES.ADMIN_OVERVIEW, permission: "Permissions.Users.View" },
      { title: "Users", href: ROUTES.ADMIN_USERS, permission: "Permissions.Users.View" },
      { title: "Roles", href: ROUTES.ADMIN_ROLES, permission: "Permissions.Roles.View" },
      { title: "Permissions", href: ROUTES.ADMIN_PERMISSIONS, permission: "Permissions.Roles.View" },
      { title: "Audit Logs", href: ROUTES.ADMIN_AUDIT_LOGS, permission: "Permissions.Reports.Audit" },
      { title: "Security", href: ROUTES.ADMIN_SECURITY, permission: "Permissions.Users.View" },
      { title: "Module Status", href: ROUTES.ADMIN_MODULE_STATUS, permission: "Permissions.Users.View" },
      { title: "System", href: ROUTES.ADMIN_SYSTEM, permission: "Permissions.Users.View" }
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U";

  useEffect(() => {
    const currentPath = location.pathname;
    const newOpenMenus = { ...openMenus };
    let changed = false;

    sidebarNavItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => 
          currentPath === child.href || (child.href !== "/" && currentPath.startsWith(`${child.href}/`))
        );
        if (isChildActive && !newOpenMenus[item.title]) {
          newOpenMenus[item.title] = true;
          changed = true;
        }
      }
    });

    if (changed) {
      setOpenMenus(newOpenMenus);
    }
  }, [location.pathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <nav className="relative hidden h-full w-64 flex-col border-r border-white/[0.04] bg-[#0a0e1a] text-slate-100 md:flex select-none">
      {/* Enterprise Branding Header */}
      <div className="flex h-[64px] items-center px-5 border-b border-white/[0.06] bg-gradient-to-r from-[#0a0e1a] to-[#0f1525]">
        <Link to={getDefaultRouteForUser(user)} className="flex items-center gap-3 group w-full">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 border border-indigo-400/30 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <Cpu className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors duration-200">NovaERP</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-1">Manufacturing Cloud</span>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 min-h-0 py-3">
        <div className="px-3 mb-2.5 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
          Enterprise Modules
        </div>
        <ul className="grid gap-1 px-2.5">
          {sidebarNavItems.map((item) => {
            const hasAccess = item.children 
              ? item.children.some(child => hasPermission(child.permission))
              : hasPermission(item.permission!);

            if (!hasAccess) return null;

            if (item.children) {
              const isOpen = openMenus[item.title];
              const isActive = item.children.some(child => 
                location.pathname === child.href || (child.href !== "/" && location.pathname.startsWith(`${child.href}/`))
              );

              return (
                <li key={item.title} className="mb-0.5">
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      "w-full group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "bg-indigo-600/15 text-white border border-indigo-500/30 shadow-xs"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200 shrink-0",
                        isActive 
                          ? "bg-indigo-500 text-white border-indigo-400 shadow-xs" 
                          : "bg-slate-900 border-white/10 text-slate-400 group-hover:text-white group-hover:bg-slate-800"
                      )}>
                        <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>
                      <span className="truncate text-xs font-medium">{item.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 group-hover:text-slate-400" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <ul className="mt-1 mb-1.5 space-y-0.5 pl-4 pr-1 border-l border-white/10 ml-5">
                      {item.children.map(child => {
                        if (!hasPermission(child.permission)) return null;
                        const isChildActive = location.pathname === child.href || (child.href !== "/" && location.pathname.startsWith(`${child.href}/`));
                        
                        return (
                          <li key={child.title}>
                            <Link
                              to={child.href}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150",
                                isChildActive
                                  ? "bg-indigo-500/20 text-indigo-300 font-semibold border-l-2 border-indigo-400 pl-2"
                                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                              )}
                            >
                              <span className="truncate">{child.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(`${item.href}/`));
            
            return (
              <li key={item.title}>
                <Link
                  to={item.href!}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-200",
                    isActive
                      ? "bg-indigo-600/20 text-white border border-indigo-500/30 shadow-xs"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200 shrink-0",
                    isActive 
                      ? "bg-indigo-500 text-white border-indigo-400 shadow-xs" 
                      : "bg-slate-900 border-white/10 text-slate-400 group-hover:text-white group-hover:bg-slate-800"
                  )}>
                    <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="truncate text-xs font-medium">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
      
      {/* Sidebar Footer User Card */}
      <div className="p-3 border-t border-white/[0.06] bg-[#080c17]">
        <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors duration-200">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-[11px] shadow-md shadow-indigo-500/20 ring-2 ring-white/10 shrink-0">
            {userInitials}
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-xs font-semibold text-slate-100 leading-tight truncate" title={user?.email || "User"}>
              {user?.email ? user.email.split("@")[0] : "User"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <span className="text-[10px] text-slate-500 font-medium truncate" title={user?.role || "Role"}>
                {user?.role || "Super Admin"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
