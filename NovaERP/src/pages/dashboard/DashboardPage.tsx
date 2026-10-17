import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { EnterpriseKpiGrid } from "@/components/dashboard/EnterpriseKpiGrid";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { PendingActions } from "@/components/dashboard/PendingActions";
import { CriticalAttention } from "@/components/dashboard/CriticalAttention";
import { ProductionChart } from "@/components/dashboard/ProductionChart";

import { ProcurementDashboardPage } from "@/pages/procurement/ProcurementDashboardPage";
import { ProductionDashboardPage } from "@/pages/production/ProductionDashboardPage";
import { WarehouseDashboardPage } from "@/pages/warehouse/WarehouseDashboardPage";
import { QualityDashboardPage } from "@/pages/quality/QualityDashboardPage";
import { SalesDashboardPage } from "@/pages/sales/SalesDashboardPage";
import { WarrantyDashboardPage } from "@/pages/warranty/WarrantyDashboardPage";

export default function DashboardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Explicit role-based routing takes precedence to prevent cross-domain permission overlaps
  if (user?.role === "Procurement Manager") return <ProcurementDashboardPage />;
  if (user?.role === "Production Manager") return <ProductionDashboardPage />;
  if (user?.role === "Warehouse Manager") return <WarehouseDashboardPage />;
  if (user?.role === "Quality Engineer") return <QualityDashboardPage />;
  if (user?.role === "Sales Manager") return <SalesDashboardPage />;
  if (user?.role === "Warranty Executive") return <WarrantyDashboardPage />;

  // Fallback to permission-based routing for custom roles (excluding Super Admin)
  if (user?.role !== "Super Admin") {
    if (hasPermission("Permissions.PurchaseRequests.View") && hasPermission("Permissions.PurchaseOrders.View")) {
      return <ProcurementDashboardPage />;
    }
    if (hasPermission("Permissions.ProductionOrders.View")) {
      return <ProductionDashboardPage />;
    }
    if (hasPermission("Permissions.GoodsReceipts.Receive")) {
      return <WarehouseDashboardPage />;
    }
    if (hasPermission("Permissions.QualityInspection.View")) {
      return <QualityDashboardPage />;
    }
    if (hasPermission("Permissions.SalesOrders.View")) {
      return <SalesDashboardPage />;
    }
    if (hasPermission("Permissions.Warranties.View")) {
      return <WarrantyDashboardPage />;
    }
  }

  // Super Admin / Enterprise Dashboard default view
  return (
    <div className="w-full flex flex-col gap-6">
      <WelcomeSection />
      <EnterpriseKpiGrid />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12 xl:col-span-8 flex flex-col gap-6">
          <CriticalAttention />
          <ProductionChart />
        </div>

        <div className="md:col-span-12 xl:col-span-4 flex flex-col gap-6">
          <PendingActions />
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}
