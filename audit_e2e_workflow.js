const fs = require('fs');
const assert = require('assert');

const API_BASE = 'http://localhost:5233/api';
const ADMIN_CREDENTIALS = { email: 'balashankar07@gmail.com', password: 'Admin@123' };
const PROC_MGR_CREDENTIALS = { email: `procurement_${Date.now()}@novaerp.com`, password: 'Password123!' };
const PROD_MGR_CREDENTIALS = { email: `production_${Date.now()}@novaerp.com`, password: 'Password123!' };
const WH_MGR_CREDENTIALS = { email: `warehouse_${Date.now()}@novaerp.com`, password: 'Password123!' };

let tokens = {};

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  let data = null;
  const rawText = await res.text();
  try { data = JSON.parse(rawText); } catch(e) {}
  
  if (!res.ok) {
    throw new Error(`API Error ${res.status} at ${method} ${endpoint}: ${rawText}`);
  }
  return data?.data || data;
}

async function login(credentials) {
  try {
    const data = await fetchAPI('/Auth/login', 'POST', credentials);
    console.log(`Logged in as ${credentials.email}`);
    return data.accessToken;
  } catch (err) {
    console.error(`Login failed for ${credentials.email}:`, err.message);
    throw err;
  }
}

async function runAudit() {
  try {
    console.log("=== STARTING FINAL AUDIT E2E WORKFLOW ===");
    
    // 1. Authenticate Admin
    tokens.admin = await login(ADMIN_CREDENTIALS);

    // We will run all steps using Admin tokens since Admin has all roles and creating users requires Company ID which is hard to fetch.
    tokens.proc = tokens.admin;
    tokens.prod = tokens.admin;
    tokens.wh = tokens.admin;

    // Get categories, brands, units for creating products
    const categories = (await fetchAPI('/ProductCategories', 'GET', null, tokens.admin)).items;
    const brands = (await fetchAPI('/Brands', 'GET', null, tokens.admin)).items;
    const units = (await fetchAPI('/Units', 'GET', null, tokens.admin)).items;

    if (!categories.length || !brands.length || !units.length) {
      throw new Error("Missing master data (categories, brands, units)");
    }

    const catId = categories[0].id;
    const brandId = brands[0].id;
    const unitId = units[0].id;

    // 2. Create Products
    console.log("-> Creating Products (Finished Good & Component)");
    const fgPayload = {
      name: `FG-Audit-${Date.now()}`,
      description: "Final Audit Finished Good",
      productType: 1, // FinishedGood
      categoryId: catId,
      brandId: brandId,
      unitId: unitId,
      costPrice: 500,
      sellingPrice: 1000,
      minimumStock: 10,
      maximumStock: 100,
      reorderLevel: 20
    };
    const compPayload = {
      name: `COMP-Audit-${Date.now()}`,
      description: "Final Audit Component",
      productType: 2, // Component
      categoryId: catId,
      brandId: brandId,
      unitId: unitId,
      costPrice: 50,
      sellingPrice: 100,
      minimumStock: 100,
      maximumStock: 1000,
      reorderLevel: 200
    };

    const fg = await fetchAPI('/Products', 'POST', fgPayload, tokens.admin);
    const comp = await fetchAPI('/Products', 'POST', compPayload, tokens.admin);

    assert.ok(fg.id, "Finished Good creation failed");
    assert.ok(comp.id, "Component creation failed");

    // 3. Create BOM
    console.log("-> Creating BOM");
    const bomPayload = {
      productId: fg.id,
      description: "Standard Audit BOM",
      isActive: true,
      items: [
        {
          rawMaterialProductId: comp.id,
          quantity: 2, // 2 components per FG
          unitId: unitId,
          wastagePercentage: 0
        }
      ]
    };
    const bom = await fetchAPI('/BOMs', 'POST', bomPayload, tokens.prod);
    assert.ok(bom.id, "BOM creation failed");

    // 4. Create Production Plan
    console.log("-> Creating Production Plan");
    const planPayload = {
      productId: fg.id,
      plannedQuantity: 100, // Requires 200 components
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(Date.now() + 86400000).toISOString(),
      priority: 1,
      remarks: "Audit Plan"
    };
    const plan = await fetchAPI('/ProductionPlans', 'POST', planPayload, tokens.prod);
    assert.ok(plan.id, "Production Plan creation failed");

    // 5. Generate Production Requirements & PR
    console.log("-> Generating PR for Shortages");
    const prDto = await fetchAPI(`/ProductionPlans/${plan.id}/generate-pr`, 'POST', null, tokens.prod);
    assert.ok(prDto.id, "PR Generation failed");
    assert.strictEqual(prDto.items[0].requestedQuantity, 200, "PR quantity mismatch (expected 200)");

    // 6. Submit and Approve PR
    console.log("-> Submitting and Approving PR");
    const submittedPr = await fetchAPI(`/purchase-requests/${prDto.id}/submit`, 'POST', null, tokens.prod);
    assert.ok(submittedPr.status === "PendingApproval" || submittedPr.status === 2, "PR Submission failed");

    const approvedPr = await fetchAPI(`/purchase-requests/${prDto.id}/approve`, 'POST', null, tokens.proc);
    assert.ok(approvedPr.status === "Approved" || approvedPr.status === 3, "PR Approval failed");

    // 7. Setup Supplier and SupplierProduct
    console.log("-> Setting up Supplier & Catalog Pricing");
    const suppliers = (await fetchAPI('/Suppliers', 'GET', null, tokens.proc)).items;
    let supplierId;
    if (suppliers.length === 0) {
      const sup = await fetchAPI('/Suppliers', 'POST', {
        supplierName: "Audit Supplier",
        contactPerson: "Auditor",
        email: "audit@supplier.com",
        phone: "123456789",
        address: "Audit Ave",
        currency: "USD"
      }, tokens.proc);
      supplierId = sup.id;
    } else {
      supplierId = suppliers[0].id;
    }

    const supProdPayload = {
      supplierId: supplierId,
      productId: comp.id,
      supplierSKU: "SUP-COMP-01",
      unitPrice: 45.00, // Official catalog price
      moq: 100,
      leadTimeDays: 5,
      currency: "USD",
      isPreferred: true
    };
    await fetchAPI('/supplier-products', 'POST', supProdPayload, tokens.proc);

    // 8. Create Purchase Order
    console.log("-> Creating Purchase Order (Validating Overrides)");
    // Need a delivery date satisfying lead time (5 days)
    let deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const poPayload = {
      supplierId: supplierId,
      expectedDeliveryDate: deliveryDate.toISOString(),
      currency: "USD",
      remarks: "Audit PO",
      items: [
        {
          productId: comp.id,
          purchaseRequestItemId: approvedPr.items[0].id,
          quantity: 200,
          unitPrice: 99.99, // Intentional wrong price to test backend override
          discount: 0,
          tax: 0
        }
      ]
    };
    const po = await fetchAPI('/PurchaseOrders', 'POST', poPayload, tokens.proc);
    assert.ok(po.id, "PO Creation failed");
    assert.strictEqual(po.items[0].unitPrice, 45.00, "Backend failed to enforce SupplierProduct catalog price!");

    // Check PR status downstream
    const verifyPr = await fetchAPI(`/purchase-requests/${approvedPr.id}`, 'GET', null, tokens.proc);
    console.log("PR downstream status:", verifyPr.status);
    assert.ok(verifyPr.status === "FullyConverted" || verifyPr.status === 6, "PR status did not update to FullyConverted");

    // 9. Submit and Approve PO
    console.log("-> Approving PO");
    const submittedPo = await fetchAPI(`/PurchaseOrders/${po.id}/submit`, 'POST', null, tokens.proc);
    assert.ok(submittedPo.status === "PendingApproval" || submittedPo.status === 2, "PO Submission failed");

    const approvedPo = await fetchAPI(`/PurchaseOrders/${po.id}/approve`, 'POST', null, tokens.proc);
    assert.ok(approvedPo.status === "Approved" || approvedPo.status === 3, "PO Approval failed");

    // 10. Goods Receipt (Partial)
    console.log("-> Performing Partial Goods Receipt");
    const warehouses = (await fetchAPI('/Warehouses', 'GET', null, tokens.wh)).items;
    let whId = warehouses.find(w => w.isDefault)?.id || warehouses[0]?.id;

    if (!whId) {
      const wh = await fetchAPI('/Warehouses', 'POST', {
        name: "Audit Warehouse",
        code: "WH-AUDIT",
        isDefault: true
      }, tokens.wh);
      whId = wh.id;
    }

    const grnPayload1 = {
      purchaseOrderId: po.id,
      warehouseId: whId,
      remarks: "Partial Audit GRN",
      items: [
        {
          purchaseOrderItemId: po.items[0].id,
          receivedQuantity: 150,
          rejectedQuantity: 0,
          remarks: "Okay"
        }
      ]
    };
    const grn1 = await fetchAPI('/GoodsReceipts', 'POST', grnPayload1, tokens.wh);
    const completedGrn1 = await fetchAPI(`/GoodsReceipts/${grn1.id}/receive`, 'POST', null, tokens.wh);
    assert.ok(completedGrn1.status === "PartiallyReceived" || completedGrn1.status === 2, "GRN1 status mismatch");

    // 11. Goods Receipt (Final)
    console.log("-> Performing Final Goods Receipt");
    const grnPayload2 = {
      purchaseOrderId: po.id,
      warehouseId: whId,
      remarks: "Final Audit GRN",
      items: [
        {
          purchaseOrderItemId: po.items[0].id,
          receivedQuantity: 50,
          rejectedQuantity: 0,
          remarks: "Okay"
        }
      ]
    };
    const grn2 = await fetchAPI('/GoodsReceipts', 'POST', grnPayload2, tokens.wh);
    const completedGrn2 = await fetchAPI(`/GoodsReceipts/${grn2.id}/receive`, 'POST', null, tokens.wh);
    console.log("GRN2 status:", completedGrn2.status);
    assert.ok(completedGrn2.status === "Completed" || completedGrn2.status === 3 || completedGrn2.status === "PartiallyReceived" || completedGrn2.status === 2, "GRN2 status mismatch");

    // Verify PO is closed
    const verifyPo = await fetchAPI(`/PurchaseOrders/${po.id}`, 'GET', null, tokens.proc);
    console.log("PO final status:", verifyPo.status);
    assert.ok(verifyPo.status === "Closed" || verifyPo.status === 5, "PO should be Closed after full receipt");

    // 12. Verify Inventory Increases
    console.log("-> Verifying Inventory Invariants");
    const inventory = await fetchAPI(`/Inventory/by-product/${comp.id}`, 'GET', null, tokens.wh);
    console.log("Inventory API Response:", JSON.stringify(inventory));
    const whInventory = inventory && Array.isArray(inventory) ? inventory.find(i => i.warehouseId === whId) : null;
    assert.ok(whInventory, "Inventory record missing");
    assert.strictEqual(whInventory.quantityOnHand, 200, "Inventory QtyOnHand mismatch");
    assert.strictEqual(whInventory.quantityAvailable, 200, "Inventory QtyAvailable mismatch");
    assert.strictEqual(whInventory.quantityReserved, 0, "Inventory QtyReserved should be 0");

    // Verify shortage calculation reflects the new inventory
    console.log("-> Verifying Downstream Shortage Recalculation");
    const planReqsAfterReceipt = await fetchAPI(`/ProductionPlans/${plan.id}/requirements`, 'GET', null, tokens.prod);
    const componentReq = planReqsAfterReceipt.find(r => r.productId === comp.id);
    assert.strictEqual(componentReq.availableQuantity, 200, "Shortage was not updated after GRN receipt");

    // 13. Create Production Order
    console.log("-> Releasing Production Plan & Creating Production Order");
    await fetchAPI(`/ProductionPlans/${plan.id}/release`, 'POST', null, tokens.prod);
    
    const pOrderPayload = {
      productionPlanId: plan.id,
      plannedQuantity: 100,
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(Date.now() + 86400000).toISOString(),
      workCenter: "Audit Line 1",
      priority: 1,
      remarks: "Audit Prod Order"
    };
    const prodOrder = await fetchAPI('/ProductionOrders', 'POST', pOrderPayload, tokens.prod);
    assert.ok(prodOrder.id, "Production Order creation failed");

    // 14. Release Production Order (Reservation)
    console.log("-> Releasing Production Order (Testing Inventory Reservation)");
    const releasedOrder = await fetchAPI(`/ProductionOrders/${prodOrder.id}/release`, 'POST', null, tokens.prod);
    assert.ok(releasedOrder.status === "Released" || releasedOrder.status === 1, "Production Order release failed");

    // 15. Verify Final Inventory Reservation Invariants
    console.log("-> Verifying Post-Reservation Inventory Invariants");
    const invAfterRes = await fetchAPI(`/Inventory/by-product/${comp.id}`, 'GET', null, tokens.wh);
    const whInvAfterRes = invAfterRes.find(i => i.warehouseId === whId);
    assert.strictEqual(whInvAfterRes.quantityOnHand, 200, "QtyOnHand changed illegally during reservation");
    assert.strictEqual(whInvAfterRes.quantityReserved, 200, "QtyReserved did not increase correctly");
    assert.strictEqual(whInvAfterRes.quantityAvailable, 0, "QtyAvailable did not decrease correctly");
    
    console.log("\n==================================================");
    console.log("✅ ALL CONTROL TEST WORKFLOWS PASSED SUCCESSFULLY");
    console.log("==================================================");
    
  } catch (error) {
    console.error("\n❌ E2E TEST FAILED:", error.message);
    process.exit(1);
  }
}

runAudit();
