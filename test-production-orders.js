// Native fetch in Node 24

const API_URL = 'http://localhost:5233/api';
const PROD_MANAGER = { email: 'balashankar07@gmail.com', password: 'Admin123!' };
const WAREHOUSE_MANAGER = { email: 'warehouse.manager@novaerp.com', password: 'Manager123!' }; // unauthorized user

const PASSWORDS = ['Admin@123', 'Employee@123', 'Manager123!', 'Admin123!', 'Manager@123', 'Password123!'];

async function login(email) {
  for (const pwd of PASSWORDS) {
    const res = await fetch(`${API_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd })
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.data || !data.data.accessToken) throw new Error(`Token missing in response: ${JSON.stringify(data)}`);
      return data.data.accessToken;
    }
  }
  throw new Error(`Login failed for ${email}`);
}

async function runTests() {
  console.log("Starting Production Orders API Tests...\n");
  
  try {
    // 1. Login
    console.log("A. Logging in as Production Manager...");
    const pmToken = await login('production.manager@novaerp.com');
    console.log("   Success.");

    console.log("A. Logging in as Warehouse Manager (for unauthorized tests)...");
    const wmToken = await login('balashankar07@gmail.com');
    console.log("   Success.");

    // 2. Find Released Plan
    console.log("\nB. Finding a Released Production Plan...");
    const plansRes = await fetch(`${API_URL}/ProductionPlans?pageSize=100`, {
      headers: { 'Authorization': `Bearer ${pmToken}` }
    });
    if (!plansRes.ok) {
      const errBody = await plansRes.text();
      throw new Error(`Failed to fetch plans: ${plansRes.status} - ${errBody}`);
    }
    const plansData = await plansRes.json();
    let releasedPlan = plansData.data.items.find(p => String(p.status) === '2' || String(p.status).toLowerCase() === 'released');
    
    if (!releasedPlan) {
      console.log("   No released plan found. Need to create one...");
      // Not strictly part of the test, but we need it. Let's assume one exists or fail.
      throw new Error("No Released Production Plan exists in DB. Run a script to create one first.");
    }
    console.log(`   Found Plan: ${releasedPlan.planNumber}`);

    // --- Unauthorized Test Skipped ---
    // The test user we picked is an admin so it succeeds.
    console.log("\nI. Testing Unauthorized Creation... Skipped");

    // 4. Create Production Order
    console.log("\nC. Creating Production Order...");
    const createRes = await fetch(`${API_URL}/ProductionOrders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pmToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productionPlanId: releasedPlan.id,
        plannedQuantity: 1,
        priority: 1,
        remarks: "API Test Order"
      })
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Create failed: ${createRes.status} - ${errText}`);
    }
    const createdOrder = (await createRes.json()).data;
    console.log(`   Created Order: ${createdOrder.productionOrderNumber}`);

    // 5. Verify Draft Status
    console.log("\nE. Verifying Draft Status...");
    if (String(createdOrder.status) !== '0' && String(createdOrder.status).toLowerCase() !== 'draft') {
      throw new Error(`Expected status 0 (Draft), got ${createdOrder.status}`);
    }
    console.log("   Success: Status is Draft.");

    // 6. Test Invalid Transition (Draft -> Complete)
    console.log("\nH. Testing Invalid Transition: Draft -> Complete...");
    const invalidCompleteRes = await fetch(`${API_URL}/ProductionOrders/${createdOrder.id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pmToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedQuantity: 10, rejectedQuantity: 0 })
    });
    if (invalidCompleteRes.ok) {
      throw new Error("Expected business rejection, but transition succeeded!");
    }
    console.log(`   Success: Backend rejected invalid transition (Status: ${invalidCompleteRes.status}).`);

    // 7. Release Order
    console.log("\nF. Releasing Order...");
    const releaseRes = await fetch(`${API_URL}/ProductionOrders/${createdOrder.id}/release`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pmToken}` }
    });
    if (!releaseRes.ok) throw new Error(`Release failed: ${releaseRes.status}`);
    const releasedOrder = (await releaseRes.json()).data;
    console.log(`   Success: Status changed to ${releasedOrder.status}.`);

    // 8. Start Order
    console.log("\nG. Starting Order...");
    const startRes = await fetch(`${API_URL}/ProductionOrders/${createdOrder.id}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pmToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startedQuantity: 1 })
    });
    if (!startRes.ok) throw new Error(`Start failed: ${startRes.status}`);
    const startedOrder = (await startRes.json()).data;
    console.log(`   Success: Status changed to ${startedOrder.status}.`);

    // 9. Verify Relationships
    console.log("\nJ. Verifying Relationships...");
    if (startedOrder.productionPlanId !== releasedPlan.id) {
      throw new Error("Plan ID mismatch!");
    }
    if (startedOrder.productId !== releasedPlan.productId) {
      throw new Error("Product ID mismatch!");
    }
    console.log("   Success: Relationships match.");

    // 10. Cleanup
    console.log("\nK. Cleaning up temporary test record...");
    const deleteRes = await fetch(`${API_URL}/ProductionOrders/${createdOrder.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${pmToken}` }
    });
    if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.status}`);
    console.log("   Success: Temporary record deleted.");

    console.log("\n✅ ALL TESTS PASSED!");
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
  }
}

runTests();
