/**
 * NovaERP AI Assistant — Live Data Service
 * Fetches real-time system stats for each role when the AI drawer opens.
 * Gracefully handles permission errors (403) with null values.
 */

import { dashboardApi } from "@/api/dashboard.api";
import { procurementApi } from "@/api/procurement.api";
import { qualityApi } from "@/api/quality.api";
import { salesApi } from "@/api/sales.api";
import { warrantiesApi } from "@/api/warranties.api";
import { productionApi } from "@/api/production.api";
import { dashboardApi as dashApi } from "@/api/dashboard.api";
import type { RoleKey } from "./ai-knowledge-base";

export interface LiveInsight {
  label: string;
  value: string | number;
  status: "ok" | "warn" | "critical" | "info";
  emoji: string;
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function fetchLiveInsights(role: RoleKey): Promise<LiveInsight[]> {
  const insights: LiveInsight[] = [];

  if (role === "super_admin") {
    const summary = await safe(() => dashboardApi.getSummary());
    if (summary) {
      insights.push({ label: "Open Purchase Orders", value: summary.openPurchaseOrders, status: summary.openPurchaseOrders > 0 ? "warn" : "ok", emoji: "📦" });
      insights.push({ label: "Pending Inspections", value: summary.pendingQualityInspections, status: summary.pendingQualityInspections > 5 ? "critical" : summary.pendingQualityInspections > 0 ? "warn" : "ok", emoji: "🔬" });
      insights.push({ label: "Pending Shipments", value: summary.shipmentsPending, status: summary.shipmentsPending > 0 ? "warn" : "ok", emoji: "🚛" });
      insights.push({ label: "Open Warranty Claims", value: summary.openWarrantyClaims, status: summary.openWarrantyClaims > 5 ? "critical" : "warn", emoji: "🛡️" });
      insights.push({ label: "Active Warranties", value: summary.activeWarranties, status: "info", emoji: "✅" });
      insights.push({ label: "Sales This Month", value: summary.salesThisMonth, status: "info", emoji: "💼" });
    }
  }

  if (role === "procurement_manager") {
    const summary = await safe(() => procurementApi.getSummary());
    if (summary) {
      insights.push({ label: "Pending PRs", value: summary.pendingPurchaseRequests, status: summary.pendingPurchaseRequests > 0 ? "warn" : "ok", emoji: "📋" });
      insights.push({ label: "Open POs", value: summary.openPurchaseOrders, status: summary.openPurchaseOrders > 0 ? "info" : "ok", emoji: "📦" });
      insights.push({ label: "Pending Receipts", value: summary.pendingReceipts, status: summary.pendingReceipts > 0 ? "warn" : "ok", emoji: "🚚" });
      insights.push({ label: "Overdue Receipts", value: summary.overdueReceipts, status: summary.overdueReceipts > 0 ? "critical" : "ok", emoji: "⚠️" });
      insights.push({ label: "Active Suppliers", value: summary.activeSuppliersCount, status: "info", emoji: "🏭" });
      insights.push({ label: "Supplier Issues", value: summary.supplierIssuesCount, status: summary.supplierIssuesCount > 0 ? "warn" : "ok", emoji: "🔴" });
    }
  }

  if (role === "production_manager") {
    const [summary, orders] = await Promise.all([
      safe(() => dashApi.getSummary()),
      safe(() => productionApi.getAllOrders({ pageNumber: 1, pageSize: 5 })),
    ]);
    if (summary) {
      insights.push({ label: "Completed Production Orders", value: summary.completedProductionOrders, status: "info", emoji: "✅" });
    }
    if (orders) {
      const inProgress = orders.items?.filter((o: any) => o.status === "InProgress" || o.status === "Released").length ?? 0;
      const draft = orders.items?.filter((o: any) => o.status === "Draft" || o.status === "Planned").length ?? 0;
      insights.push({ label: "Orders In Progress", value: inProgress, status: inProgress > 0 ? "info" : "ok", emoji: "⚙️" });
      insights.push({ label: "Planned Orders", value: draft, status: draft > 0 ? "warn" : "ok", emoji: "📅" });
    }
    const inv = await safe(() => dashApi.getInventorySummary());
    if (inv) {
      insights.push({ label: "Low Stock Materials", value: inv.lowStockItems, status: inv.lowStockItems > 0 ? "critical" : "ok", emoji: "📉" });
    }
  }

  if (role === "warehouse_manager") {
    const inv = await safe(() => dashApi.getInventorySummary());
    if (inv) {
      insights.push({ label: "Products in Stock", value: inv.totalProductsInStock, status: "info", emoji: "📦" });
      insights.push({ label: "Available Qty", value: inv.totalAvailableQuantity, status: "info", emoji: "✅" });
      insights.push({ label: "Reserved Qty", value: inv.totalReservedQuantity, status: inv.totalReservedQuantity > 0 ? "info" : "ok", emoji: "🔒" });
      insights.push({ label: "Low Stock Items", value: inv.lowStockItems, status: inv.lowStockItems > 0 ? "critical" : "ok", emoji: "⚠️" });
      insights.push({ label: "Out of Stock", value: inv.outOfStockItems, status: inv.outOfStockItems > 0 ? "critical" : "ok", emoji: "🔴" });
      insights.push({ label: "Active Warehouses", value: inv.warehouseCount, status: "info", emoji: "🏪" });
    }
  }

  if (role === "quality_engineer") {
    const qSummary = await safe(() => qualityApi.getSummary());
    if (qSummary) {
      insights.push({ label: "Pending Inspections", value: (qSummary as any).pendingInspections ?? (qSummary as any).totalPending ?? 0, status: "warn", emoji: "🔬" });
      insights.push({ label: "Passed Today", value: (qSummary as any).passedToday ?? (qSummary as any).passedCount ?? 0, status: "ok", emoji: "✅" });
      insights.push({ label: "Failed / Rejected", value: (qSummary as any).failedCount ?? (qSummary as any).rejectedCount ?? 0, status: "critical", emoji: "❌" });
    }
    const dash = await safe(() => dashboardApi.getSummary());
    if (dash) {
      insights.push({ label: "Pending Inspections (System)", value: dash.pendingQualityInspections, status: dash.pendingQualityInspections > 0 ? "warn" : "ok", emoji: "📋" });
    }
  }

  if (role === "sales_manager") {
    const [salesSum, dash] = await Promise.all([
      safe(() => salesApi.getSummary()),
      safe(() => dashboardApi.getSummary()),
    ]);
    if (salesSum) {
      insights.push({ label: "Total Sales Orders", value: (salesSum as any).totalOrders ?? (salesSum as any).totalSalesOrders ?? 0, status: "info", emoji: "💼" });
      insights.push({ label: "Pending Approval", value: (salesSum as any).pendingOrders ?? 0, status: "warn", emoji: "⏳" });
      insights.push({ label: "Confirmed Orders", value: (salesSum as any).approvedOrders ?? (salesSum as any).confirmedOrders ?? 0, status: "info", emoji: "✅" });
    }
    if (dash) {
      insights.push({ label: "Pending Shipments", value: dash.shipmentsPending, status: dash.shipmentsPending > 0 ? "warn" : "ok", emoji: "🚛" });
      insights.push({ label: "Sales This Month", value: dash.salesThisMonth, status: "info", emoji: "📈" });
    }
  }

  if (role === "warranty_executive") {
    const warrantySum = await safe(() => warrantiesApi.getSummary());
    if (warrantySum) {
      insights.push({ label: "Active Warranties", value: warrantySum.activeWarranties, status: "info", emoji: "🛡️" });
      insights.push({ label: "Expiring Soon", value: warrantySum.expiringWarranties, status: warrantySum.expiringWarranties > 0 ? "warn" : "ok", emoji: "⏰" });
      insights.push({ label: "Pending Claims", value: warrantySum.pendingClaims, status: warrantySum.pendingClaims > 0 ? "warn" : "ok", emoji: "📋" });
      insights.push({ label: "Approved Claims", value: warrantySum.approvedClaims, status: "info", emoji: "✅" });
      insights.push({ label: "Rejected Claims", value: warrantySum.rejectedClaims, status: warrantySum.rejectedClaims > 0 ? "critical" : "ok", emoji: "❌" });
      insights.push({ label: "Avg Resolution (days)", value: Math.round(warrantySum.averageResolutionDays) || "N/A", status: warrantySum.averageResolutionDays > 7 ? "warn" : "ok", emoji: "⏱️" });
    }
  }

  return insights;
}

/**
 * Synonym map for fuzzy input normalization.
 * Maps common typos/synonyms → canonical keywords used in the knowledge base.
 */
export const SYNONYMS: Record<string, string> = {
  "purchse": "purchase",
  "purchaes": "purchase",
  "purcase": "purchase",
  "puchase": "purchase",
  "receit": "receipt",
  "reciept": "receipt",
  "recept": "receipt",
  "grn": "goods receipt",
  "gr": "goods receipt",
  "inventry": "inventory",
  "inventori": "inventory",
  "invntory": "inventory",
  "stok": "stock",
  "stock level": "stock",
  "warrenty": "warranty",
  "waranty": "warranty",
  "guarentee": "warranty",
  "garuntee": "warranty",
  "qualiy": "quality",
  "qualit": "quality",
  "inspction": "inspection",
  "inspecton": "inspection",
  "inspetion": "inspection",
  "prodution": "production",
  "producion": "production",
  "productoin": "production",
  "manufactring": "production",
  "manufactur": "production",
  "bom": "bill of materials",
  "bomm": "bill of materials",
  "materail": "material",
  "materails": "material",
  "supplier": "supplier",
  "suplier": "supplier",
  "suuplier": "supplier",
  "shipmnt": "shipment",
  "shiipment": "shipment",
  "delivry": "delivery",
  "delvery": "delivery",
  "invoce": "invoice",
  "invioce": "invoice",
  "payement": "payment",
  "paymnt": "payment",
  "clam": "claim",
  "claem": "claim",
  "rma": "return",
  "retun": "return",
  "retunr": "return",
  "ncr": "non conformance",
  "capa": "corrective action",
  "kpi": "report",
  "metrics": "report",
  "analytics": "report",
  "dashbord": "dashboard",
  "dasboard": "dashboard",
  "how do i": "",
  "how to": "",
  "where to": "",
  "where is": "",
  "what is": "",
  "can i": "",
  "show me": "",
  "tell me about": "",
  "i need to": "",
  "i want to": "",
  "help with": "",
};

export function normalizeInput(text: string): string {
  let normalized = text.toLowerCase();
  for (const [typo, correct] of Object.entries(SYNONYMS)) {
    normalized = normalized.replace(new RegExp(`\\b${typo}\\b`, "gi"), correct);
  }
  return normalized.trim();
}
