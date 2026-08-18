import axios from 'axios';
const API_URL = 'http://localhost:5233/api';

async function testProductApi() {
    console.log("=== TEST A: PRODUCTS API WITH PRODUCTTYPE FILTER ===");
    try {
        const loginRes = await axios.post(`${API_URL}/Auth/login`, {
            email: 'balashankar07@gmail.com', password: 'Admin@123'
        });
        const token = loginRes.data.data.accessToken;
        
        const res = await axios.get(`${API_URL}/Products?pageSize=500&productType=2`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`Status: ${res.status}`);
        
        // Response is wrapped in ApiResponse
        const data = res.data;
        if (!data.success) {
            console.error("API returned success=false");
            return;
        }
        
        // PagedResult payload
        const paginatedResult = data.data;
        console.log(`Total Components found: ${paginatedResult.totalCount}`);
        
        let allComponents = true;
        for (const item of paginatedResult.items) {
            if (item.productType !== 2 && item.productType !== "Component") {
                console.error(`Invalid ProductType found in results: ${item.name} (${item.productType})`);
                allComponents = false;
            }
        }
        
        if (allComponents) {
            console.log("[PASS] Server-side filtering correctly excluded Finished Goods and returned real Components.");
        }
        
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

testProductApi().catch(console.error);
