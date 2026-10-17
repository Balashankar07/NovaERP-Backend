import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/auth-provider";
import { PublicRoute, ProtectedRoute } from "@/components/common";
import { DashboardLayout } from "@/components/layout";
import { ROUTES } from "@/routes";
import { LoadingView } from "@/components/ui/state-views";

// Lazy-loaded pages
const LoginPage = React.lazy(() => import("@/pages/auth").then(m => ({ default: m.LoginPage })));
const DashboardPage = React.lazy(() => import("@/pages/dashboard").then(m => ({ default: m.DashboardPage })));
const BrandsListPage = React.lazy(() => import("@/pages/brands").then(m => ({ default: m.BrandsListPage })));
const CategoriesListPage = React.lazy(() => import("@/pages/categories").then(m => ({ default: m.CategoriesListPage })));
const UnitsListPage = React.lazy(() => import("@/pages/units").then(m => ({ default: m.UnitsListPage })));
const ProductsListPage = React.lazy(() => import("@/pages/products").then(m => ({ default: m.ProductsListPage })));
const SuppliersListPage = React.lazy(() => import("@/pages/suppliers").then(m => ({ default: m.SuppliersListPage })));
const UsersListPage = React.lazy(() => import("@/pages/settings").then(m => ({ default: m.UsersListPage })));
const RolesListPage = React.lazy(() => import("@/pages/settings").then(m => ({ default: m.RolesListPage })));
const AuditLogsListPage = React.lazy(() => import("@/pages/settings").then(m => ({ default: m.AuditLogsListPage })));

// Administration pages
const AdminOverviewPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminOverviewPage })));
const AdminUsersPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminUsersPage })));
const AdminRolesPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminRolesPage })));
const AdminPermissionsPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminPermissionsPage })));
const AdminAuditLogsPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminAuditLogsPage })));
const AdminSecurityPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminSecurityPage })));
const AdminModuleStatusPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminModuleStatusPage })));
const AdminSystemPage = React.lazy(() => import("@/pages/administration").then(m => ({ default: m.AdminSystemPage })));
const BOMListPage = React.lazy(() => import("@/pages/boms").then(m => ({ default: m.default })));
const ProfilePage = React.lazy(() => import("@/pages/profile").then(m => ({ default: m.ProfilePage })));
const ProductionPlansListPage = React.lazy(() => import("@/pages/production/ProductionPlansListPage").then(m => ({ default: m.ProductionPlansListPage })));
const ProductionPlanDetailsPage = React.lazy(() => import("@/pages/production/ProductionPlanDetailsPage").then(m => ({ default: m.ProductionPlanDetailsPage })));
const ProductionOrdersListPage = React.lazy(() => import("@/pages/production/ProductionOrdersListPage").then(m => ({ default: m.ProductionOrdersListPage })));
const ProductionOrderDetailsPage = React.lazy(() => import("@/pages/production/ProductionOrderDetailsPage").then(m => ({ default: m.ProductionOrderDetailsPage })));
const ProductionExecutionsListPage = React.lazy(() => import("@/pages/production/ProductionExecutionsListPage").then(m => ({ default: m.ProductionExecutionsListPage })));
const ProductionExecutionDetailsPage = React.lazy(() => import("@/pages/production/ProductionExecutionDetailsPage").then(m => ({ default: m.ProductionExecutionDetailsPage })));
const WorkCentersPage = React.lazy(() => import("@/pages/productionOperations/WorkCentersPage").then(m => ({ default: m.WorkCentersPage })));
const MachinesPage = React.lazy(() => import("@/pages/productionOperations/MachinesPage").then(m => ({ default: m.MachinesPage })));
const ProductionRoutingsPage = React.lazy(() => import("@/pages/productionOperations/ProductionRoutingsPage").then(m => ({ default: m.ProductionRoutingsPage })));
const WorkerAssignmentsPage = React.lazy(() => import("@/pages/productionOperations/WorkerAssignmentsPage").then(m => ({ default: m.WorkerAssignmentsPage })));
const ProductionSchedulesPage = React.lazy(() => import("@/pages/productionOperations/ProductionSchedulesPage").then(m => ({ default: m.ProductionSchedulesPage })));
const ProductionEventsPage = React.lazy(() => import("@/pages/productionOperations/ProductionEventsPage").then(m => ({ default: m.ProductionEventsPage })));
const ProductionOperationsReportsPage = React.lazy(() => import("@/pages/productionOperations/ProductionOperationsReportsPage").then(m => ({ default: m.ProductionOperationsReportsPage })));
const ForbiddenPage = React.lazy(() => import("@/pages/error").then(m => ({ default: m.ForbiddenPage })));
const NotFoundPage = React.lazy(() => import("@/pages/error").then(m => ({ default: m.NotFoundPage })));
const PurchaseOrdersListPage = React.lazy(() => import("@/pages/procurement").then(m => ({ default: m.PurchaseOrdersListPage })));
const PurchaseRequestsListPage = React.lazy(() => import("@/pages/procurement").then(m => ({ default: m.PurchaseRequestsListPage })));
const GoodsReceiptsListPage = React.lazy(() => import("@/pages/procurement").then(m => ({ default: m.GoodsReceiptsListPage })));
const ProcurementOverviewPage = React.lazy(() => import("@/pages/procurement").then(m => ({ default: m.ProcurementOverviewPage })));
const InventoryOverviewPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.InventoryOverviewPage })));
const InventoryStockPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.InventoryStockPage })));
const InventoryTransactionsPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.InventoryTransactionsPage })));
const WarehouseListPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.WarehouseListPage })));
const WarehouseDetailsPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.WarehouseDetailsPage })));
const WarehouseLocationsPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.WarehouseLocationsPage })));
const BatchesListPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.BatchesListPage })));
const SerialsListPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.SerialsListPage })));
const DamagedBlockedStockPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.DamagedBlockedStockPage })));
const StockTraceabilityPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.StockTraceabilityPage })));
const WarehouseTraceabilityReportsPage = React.lazy(() => import("@/pages/inventory").then(m => ({ default: m.WarehouseTraceabilityReportsPage })));
const QualityInspectionsListPage = React.lazy(() => import("@/pages/quality").then(m => ({ default: m.QualityInspectionsListPage })));
const QualityInspectionDetailsPage = React.lazy(() => import("@/pages/quality").then(m => ({ default: m.QualityInspectionDetailsPage })));
const SalesOrdersListPage = React.lazy(() => import("@/pages/sales").then(m => ({ default: m.SalesOrdersListPage })));
const SalesOrderDetailsPage = React.lazy(() => import("@/pages/sales").then(m => ({ default: m.SalesOrderDetailsPage })));
const DistributorsListPage = React.lazy(() => import("@/pages/sales").then(m => ({ default: m.DistributorsListPage })));
const ShipmentsListPage = React.lazy(() => import("@/pages/distribution").then(m => ({ default: m.ShipmentsListPage })));
const ShipmentDetailsPage = React.lazy(() => import("@/pages/distribution").then(m => ({ default: m.ShipmentDetailsPage })));

const ProcurementDashboardPage = React.lazy(() => import("@/pages/procurement/ProcurementDashboardPage").then(m => ({ default: m.ProcurementDashboardPage })));
const ProductionDashboardPage = React.lazy(() => import("@/pages/production/ProductionDashboardPage").then(m => ({ default: m.ProductionDashboardPage })));
const WarehouseDashboardPage = React.lazy(() => import("@/pages/warehouse/WarehouseDashboardPage").then(m => ({ default: m.WarehouseDashboardPage })));
const DistributionDashboardPage = React.lazy(() => import("@/pages/distribution/DistributionDashboardPage").then(m => ({ default: m.DistributionDashboardPage })));
const QualityDashboardPage = React.lazy(() => import("@/pages/quality/QualityDashboardPage").then(m => ({ default: m.QualityDashboardPage })));
const SalesDashboardPage = React.lazy(() => import("@/pages/sales/SalesDashboardPage").then(m => ({ default: m.SalesDashboardPage })));
const WarrantyDashboardPage = React.lazy(() => import("@/pages/warranty/WarrantyDashboardPage").then(m => ({ default: m.WarrantyDashboardPage })));
const WarrantyListPage = React.lazy(() => import("@/pages/warranty/WarrantyListPage").then(m => ({ default: m.WarrantyListPage })));

// Finance pages
const FinanceDashboardPage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.FinanceDashboardPage })));
const CustomerInvoicesListPage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.CustomerInvoicesListPage })));
const SupplierInvoicesListPage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.SupplierInvoicesListPage })));
const PaymentsListPage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.PaymentsListPage })));
const AccountsPayablePage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.AccountsPayablePage })));
const AccountsReceivablePage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.AccountsReceivablePage })));
const ChartOfAccountsPage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.ChartOfAccountsPage })));
const JournalsListPage = React.lazy(() => import("@/pages/finance").then(m => ({ default: m.JournalsListPage })));

// HR pages
const HRDashboardPage = React.lazy(() => import("@/pages/hr/HRDashboardPage").then(m => ({ default: m.HRDashboardPage })));
const DepartmentsListPage = React.lazy(() => import("@/pages/hr/DepartmentsListPage").then(m => ({ default: m.DepartmentsListPage })));
const EmployeesListPage = React.lazy(() => import("@/pages/hr/EmployeesListPage").then(m => ({ default: m.EmployeesListPage })));
const AttendancePage = React.lazy(() => import("@/pages/hr/AttendancePage").then(m => ({ default: m.AttendancePage })));
const LeaveRequestsPage = React.lazy(() => import("@/pages/hr/LeaveRequestsPage").then(m => ({ default: m.LeaveRequestsPage })));
const PayrollPage = React.lazy(() => import("@/pages/hr/PayrollPage").then(m => ({ default: m.PayrollPage })));
const HRReportsPage = React.lazy(() => import("@/pages/hr/HRReportsPage").then(m => ({ default: m.HRReportsPage })));
// Quality & Compliance pages (Domain 5)
const NCRListPage = React.lazy(() => import("@/pages/qualityCompliance").then(m => ({ default: m.NCRListPage })));
const NCRDetailPage = React.lazy(() => import("@/pages/qualityCompliance").then(m => ({ default: m.NCRDetailPage })));
const CAPAListPage = React.lazy(() => import("@/pages/qualityCompliance").then(m => ({ default: m.CAPAListPage })));
const QualityDispositionPage = React.lazy(() => import("@/pages/qualityCompliance").then(m => ({ default: m.QualityDispositionPage })));
const ReworkManagementPage = React.lazy(() => import("@/pages/qualityCompliance").then(m => ({ default: m.ReworkManagementPage })));
const ScrapManagementPage = React.lazy(() => import("@/pages/qualityCompliance").then(m => ({ default: m.ScrapManagementPage })));
const QualityComplianceReportsPage = React.lazy(() => import("@/pages/qualityCompliance").then(m => ({ default: m.QualityComplianceReportsPage })));

// Returns & Reverse Logistics pages (Domain 6)
const ReturnsDashboardPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.ReturnsDashboardPage })));
const CustomerReturnsListPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.CustomerReturnsListPage })));
const CustomerReturnDetailPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.CustomerReturnDetailPage })));
const RMAManagementPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.RMAManagementPage })));
const ReturnReceiptsPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.ReturnReceiptsPage })));
const ReturnDispositionPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.ReturnDispositionPage })));
const ReturnRepairsPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.ReturnRepairsPage })));
const ReturnReplacementsPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.ReturnReplacementsPage })));
const ReverseLogisticsReportsPage = React.lazy(() => import("@/pages/returns").then(m => ({ default: m.ReverseLogisticsReportsPage })));

// Supplier Performance & Scorecards (Domain 7)
const SupplierPerformanceDashboardPage = React.lazy(() => import("@/pages/supplierPerformance").then(m => ({ default: m.SupplierPerformanceDashboardPage })));
const SupplierPerformanceListPage = React.lazy(() => import("@/pages/supplierPerformance").then(m => ({ default: m.SupplierPerformanceListPage })));
const SupplierScorecardDetailPage = React.lazy(() => import("@/pages/supplierPerformance").then(m => ({ default: m.SupplierScorecardDetailPage })));
const SupplierPerformanceReportsPage = React.lazy(() => import("@/pages/supplierPerformance").then(m => ({ default: m.SupplierPerformanceReportsPage })));

// Logistics & Commercial Documents (Domain 8)
const LogisticsDashboardPage = React.lazy(() => import("@/pages/logisticsDocuments").then(m => ({ default: m.LogisticsDashboardPage })));
const PackingListsListPage = React.lazy(() => import("@/pages/logisticsDocuments").then(m => ({ default: m.PackingListsListPage })));
const PackingListDetailPage = React.lazy(() => import("@/pages/logisticsDocuments").then(m => ({ default: m.PackingListDetailPage })));
const DeliveryChallansListPage = React.lazy(() => import("@/pages/logisticsDocuments").then(m => ({ default: m.DeliveryChallansListPage })));
const DeliveryChallanDetailPage = React.lazy(() => import("@/pages/logisticsDocuments").then(m => ({ default: m.DeliveryChallanDetailPage })));
const ShipmentDocumentsPage = React.lazy(() => import("@/pages/logisticsDocuments").then(m => ({ default: m.ShipmentDocumentsPage })));
const LogisticsDocumentReportsPage = React.lazy(() => import("@/pages/logisticsDocuments").then(m => ({ default: m.LogisticsDocumentReportsPage })));

// In-App Notifications & Workflow Alerts (Domain 9)
const NotificationsPage = React.lazy(() => import("@/pages/notifications").then(m => ({ default: m.NotificationsPage })));
const NotificationPreferencesPage = React.lazy(() => import("@/pages/notifications").then(m => ({ default: m.NotificationPreferencesPage })));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingView title="Loading NovaERP..." className="h-screen" />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.BRANDS} element={<BrandsListPage />} />
                <Route path={ROUTES.CATEGORIES} element={<CategoriesListPage />} />
                <Route path={ROUTES.UNITS} element={<UnitsListPage />} />
                <Route path={ROUTES.PRODUCTS} element={<ProductsListPage />} />
                <Route path={ROUTES.BOM} element={<BOMListPage />} />
                <Route path={ROUTES.PRODUCTION_PLANS} element={<ProductionPlansListPage />} />
                <Route path="/production/:id" element={<ProductionPlanDetailsPage />} />
                <Route path={ROUTES.PRODUCTION_ORDERS} element={<ProductionOrdersListPage />} />
                <Route path="/production/orders/:id" element={<ProductionOrderDetailsPage />} />
                <Route path={ROUTES.PRODUCTION_EXECUTIONS} element={<ProductionExecutionsListPage />} />
                <Route path="/production/executions/:id" element={<ProductionExecutionDetailsPage />} />
                <Route path={ROUTES.PRODUCTION_WORK_CENTERS} element={<WorkCentersPage />} />
                <Route path={ROUTES.PRODUCTION_MACHINES} element={<MachinesPage />} />
                <Route path={ROUTES.PRODUCTION_ROUTINGS} element={<ProductionRoutingsPage />} />
                <Route path={ROUTES.PRODUCTION_WORKER_ASSIGNMENTS} element={<WorkerAssignmentsPage />} />
                <Route path={ROUTES.PRODUCTION_SCHEDULES} element={<ProductionSchedulesPage />} />
                <Route path={ROUTES.PRODUCTION_EVENTS} element={<ProductionEventsPage />} />
                <Route path={ROUTES.PRODUCTION_OPERATIONS_REPORTS} element={<ProductionOperationsReportsPage />} />
                {/* Administration Routes */}
                <Route path="/administration" element={<AdminOverviewPage />} />
                <Route path={ROUTES.ADMIN_OVERVIEW} element={<AdminOverviewPage />} />
                <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
                <Route path={ROUTES.ADMIN_ROLES} element={<AdminRolesPage />} />
                <Route path={ROUTES.ADMIN_PERMISSIONS} element={<AdminPermissionsPage />} />
                <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminAuditLogsPage />} />
                <Route path={ROUTES.ADMIN_SECURITY} element={<AdminSecurityPage />} />
                <Route path={ROUTES.ADMIN_MODULE_STATUS} element={<AdminModuleStatusPage />} />
                <Route path={ROUTES.ADMIN_SYSTEM} element={<AdminSystemPage />} />
                <Route path={ROUTES.USERS} element={<AdminUsersPage />} />
                <Route path={ROUTES.ROLES} element={<AdminRolesPage />} />
                <Route path={ROUTES.AUDIT_LOGS} element={<AdminAuditLogsPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                {/* Control Center Dashboards */}
                <Route path={ROUTES.DASHBOARD_PROCUREMENT} element={<ProcurementDashboardPage />} />
                <Route path={ROUTES.DASHBOARD_PRODUCTION} element={<ProductionDashboardPage />} />
                <Route path={ROUTES.DASHBOARD_WAREHOUSE} element={<WarehouseDashboardPage />} />
                <Route path={ROUTES.DASHBOARD_DISTRIBUTION} element={<DistributionDashboardPage />} />
                <Route path={ROUTES.DASHBOARD_QUALITY} element={<QualityDashboardPage />} />
                <Route path={ROUTES.DASHBOARD_SALES} element={<SalesDashboardPage />} />
                <Route path={ROUTES.DASHBOARD_WARRANTY} element={<WarrantyDashboardPage />} />
                <Route path={ROUTES.WARRANTY} element={<WarrantyListPage />} />

                {/* Finance Routes */}
                <Route path={ROUTES.FINANCE_DASHBOARD} element={<FinanceDashboardPage />} />
                <Route path={ROUTES.FINANCE_CUSTOMER_INVOICES} element={<CustomerInvoicesListPage />} />
                <Route path={ROUTES.FINANCE_SUPPLIER_INVOICES} element={<SupplierInvoicesListPage />} />
                <Route path={ROUTES.FINANCE_PAYMENTS} element={<PaymentsListPage />} />
                <Route path={ROUTES.FINANCE_ACCOUNTS_PAYABLE} element={<AccountsPayablePage />} />
                <Route path={ROUTES.FINANCE_ACCOUNTS_RECEIVABLE} element={<AccountsReceivablePage />} />
                <Route path={ROUTES.FINANCE_CHART_OF_ACCOUNTS} element={<ChartOfAccountsPage />} />
                <Route path={ROUTES.FINANCE_JOURNALS} element={<JournalsListPage />} />

                {/* HR & Workforce Routes */}
                <Route path={ROUTES.HR_DASHBOARD} element={<HRDashboardPage />} />
                <Route path={ROUTES.HR_DEPARTMENTS} element={<DepartmentsListPage />} />
                <Route path={ROUTES.HR_EMPLOYEES} element={<EmployeesListPage />} />
                <Route path={ROUTES.HR_ATTENDANCE} element={<AttendancePage />} />
                <Route path={ROUTES.HR_LEAVE} element={<LeaveRequestsPage />} />
                <Route path={ROUTES.HR_PAYROLL} element={<PayrollPage />} />
                <Route path={ROUTES.HR_REPORTS} element={<HRReportsPage />} />

                {/* Procurement */}
                <Route path={ROUTES.PROCUREMENT} element={<ProcurementOverviewPage />} />
                <Route path={ROUTES.PURCHASE_ORDERS} element={<PurchaseOrdersListPage />} />
                <Route path={ROUTES.PURCHASE_REQUESTS} element={<PurchaseRequestsListPage />} />
                <Route path={ROUTES.GOODS_RECEIPTS} element={<GoodsReceiptsListPage />} />
                <Route path={ROUTES.SUPPLIERS} element={<SuppliersListPage />} />
                {/* Inventory & Warehouses */}
                <Route path={ROUTES.INVENTORY} element={<InventoryOverviewPage />} />
                <Route path={ROUTES.INVENTORY_STOCK} element={<InventoryStockPage />} />
                <Route path={ROUTES.INVENTORY_TRANSACTIONS} element={<InventoryTransactionsPage />} />
                <Route path={ROUTES.INVENTORY_WAREHOUSES} element={<WarehouseListPage />} />
                <Route path="/inventory/warehouses/:id" element={<WarehouseDetailsPage />} />
                <Route path={ROUTES.INVENTORY_TRACEABILITY_LOCATIONS} element={<WarehouseLocationsPage />} />
                <Route path={ROUTES.INVENTORY_TRACEABILITY_BATCHES} element={<BatchesListPage />} />
                <Route path={ROUTES.INVENTORY_TRACEABILITY_SERIALS} element={<SerialsListPage />} />
                <Route path={ROUTES.INVENTORY_TRACEABILITY_DAMAGED} element={<DamagedBlockedStockPage />} />
                <Route path={ROUTES.INVENTORY_TRACEABILITY_TIMELINE} element={<StockTraceabilityPage />} />
                <Route path={ROUTES.INVENTORY_TRACEABILITY_REPORTS} element={<WarehouseTraceabilityReportsPage />} />
                {/* Quality & Compliance (Domain 5) */}
                <Route path={ROUTES.QUALITY} element={<QualityInspectionsListPage />} />
                <Route path="/quality/:id" element={<QualityInspectionDetailsPage />} />
                <Route path={ROUTES.QUALITY_NCRS} element={<NCRListPage />} />
                <Route path="/quality-compliance/ncrs/:id" element={<NCRDetailPage />} />
                <Route path={ROUTES.QUALITY_CAPAS} element={<CAPAListPage />} />
                <Route path={ROUTES.QUALITY_DISPOSITIONS} element={<QualityDispositionPage />} />
                <Route path={ROUTES.QUALITY_REWORK} element={<ReworkManagementPage />} />
                <Route path={ROUTES.QUALITY_SCRAP} element={<ScrapManagementPage />} />
                <Route path={ROUTES.QUALITY_COMPLIANCE_REPORTS} element={<QualityComplianceReportsPage />} />
                {/* Sales */}
                <Route path={ROUTES.SALES_ORDERS} element={<SalesOrdersListPage />} />
                <Route path="/sales/orders/:id" element={<SalesOrderDetailsPage />} />
                <Route path={ROUTES.DISTRIBUTORS} element={<DistributorsListPage />} />
                {/* Distribution */}
                <Route path={ROUTES.SHIPMENTS} element={<ShipmentsListPage />} />
                <Route path="/distribution/shipments" element={<ShipmentsListPage />} />
                <Route path="/distribution/shipments/:id" element={<ShipmentDetailsPage />} />
                {/* Reverse Logistics & Returns (Domain 6) */}
                <Route path={ROUTES.RETURNS_DASHBOARD} element={<ReturnsDashboardPage />} />
                <Route path={ROUTES.RETURNS_LIST} element={<CustomerReturnsListPage />} />
                <Route path="/returns/requests/:id" element={<CustomerReturnDetailPage />} />
                <Route path={ROUTES.RETURNS_RMA} element={<RMAManagementPage />} />
                <Route path={ROUTES.RETURNS_RECEIPTS} element={<ReturnReceiptsPage />} />
                <Route path={ROUTES.RETURNS_DISPOSITIONS} element={<ReturnDispositionPage />} />
                <Route path={ROUTES.RETURNS_REPAIRS} element={<ReturnRepairsPage />} />
                <Route path={ROUTES.RETURNS_REPLACEMENTS} element={<ReturnReplacementsPage />} />
                <Route path={ROUTES.RETURNS_REPORTS} element={<ReverseLogisticsReportsPage />} />
                {/* Supplier Performance & Scorecards (Domain 7) */}
                <Route path={ROUTES.SUPPLIER_PERFORMANCE_DASHBOARD} element={<SupplierPerformanceDashboardPage />} />
                <Route path={ROUTES.SUPPLIER_PERFORMANCE_LIST} element={<SupplierPerformanceListPage />} />
                <Route path="/suppliers/performance/:id" element={<SupplierScorecardDetailPage />} />
                <Route path={ROUTES.SUPPLIER_PERFORMANCE_REPORTS} element={<SupplierPerformanceReportsPage />} />
                {/* Logistics & Commercial Documents (Domain 8) */}
                <Route path={ROUTES.LOGISTICS_DASHBOARD} element={<LogisticsDashboardPage />} />
                <Route path={ROUTES.PACKING_LISTS} element={<PackingListsListPage />} />
                <Route path="/logistics/packing-lists/:id" element={<PackingListDetailPage />} />
                <Route path={ROUTES.DELIVERY_CHALLANS} element={<DeliveryChallansListPage />} />
                <Route path="/logistics/delivery-challans/:id" element={<DeliveryChallanDetailPage />} />
                <Route path={ROUTES.SHIPMENT_DOCUMENTS} element={<ShipmentDocumentsPage />} />
                <Route path={ROUTES.LOGISTICS_REPORTS} element={<LogisticsDocumentReportsPage />} />
                {/* In-App Notifications & Workflow Alerts (Domain 9) */}
                <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                <Route path={ROUTES.NOTIFICATION_PREFERENCES} element={<NotificationPreferencesPage />} />
              </Route>
            </Route>
            
            {/* Error Routes */}
            <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

            {/* Catch all - 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
