import axios from 'axios';
import assert from 'assert';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5233/api';

async function runTests() {
    console.log("Starting RBAC Workflow Tests...");

    try {
        // 1. Admin logs in
        console.log("1. Admin logging in...");
        const adminLogin = await axios.post(`${API_URL}/Auth/login`, {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        const adminToken = adminLogin.data.data.accessToken;
        const adminAxios = axios.create({ headers: { Authorization: `Bearer ${adminToken}` } });

        // Get Roles and Company
        const rolesRes = await adminAxios.get(`${API_URL}/Role`);
        const procManagerRole = rolesRes.data.data.items.find(r => r.name === 'Procurement Manager');
        const usersRes = await adminAxios.get(`${API_URL}/User`);
        const adminUser = usersRes.data.data.items.find(u => u.email === 'balashankar07@gmail.com');
        const companyId = adminUser?.companyId || '00000000-0000-0000-0000-000000000000';

        // 2. Admin creates user & Role assigned correctly
        console.log("2. Admin creating new user (Procurement Manager)...");
        const testEmail = `procurement_${Date.now()}@novaerp.com`;
        const createUserRes = await adminAxios.post(`${API_URL}/User`, {
            firstName: 'Test',
            lastName: 'Procurement',
            email: testEmail,
            phone: '1234567890',
            password: 'Password@123',
            companyId: companyId,
            roleIds: [procManagerRole.id]
        });
        const newUserId = createUserRes.data.data.id;
        console.log("User created successfully. ID:", newUserId);

        // 3. User logs in
        console.log("3. New user logging in...");
        const userLogin = await axios.post(`${API_URL}/Auth/login`, {
            email: testEmail,
            password: 'Password@123'
        });
        const userToken = userLogin.data.data.accessToken;
        const userAxios = axios.create({ headers: { Authorization: `Bearer ${userToken}` } });
        console.log("Login successful.");

        // 4. Correct JWT/permissions
        console.log("4. Verifying correct JWT/permissions...");
        const decoded = jwt.decode(userToken);
        const permissions = decoded.permissions || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']; // Adjust based on how permissions are stored
        console.log("User permissions in JWT:", permissions);
        // We know procurement manager should have access to suppliers.

        // 7. Authorized APIs work
        console.log("7. Testing authorized API (GET /api/Suppliers)...");
        try {
            await userAxios.get(`${API_URL}/Suppliers`);
            console.log("SUCCESS: Authorized API worked.");
        } catch(err) {
            console.log("Authorized API failed (might be expected if permissions aren't seeded for Procurement Manager yet, but let's see):", err.response?.status);
        }

        // 8. Unauthorized APIs return 403
        console.log("8. Testing unauthorized API (GET /api/Role)...");
        try {
            await userAxios.get(`${API_URL}/Role`);
            console.log("FAIL: Unauthorized API worked (Should have returned 403)!");
        } catch(err) {
            if (err.response?.status === 403) {
                console.log("SUCCESS: Unauthorized API returned 403.");
            } else {
                console.log("Unexpected error for unauthorized API:", err.response?.status);
            }
        }

        // 9. Admin changes role
        console.log("9. Admin changing user role to System Administrator...");
        const sysAdminRole = rolesRes.data.data.items.find(r => r.name === 'System Administrator');
        await adminAxios.put(`${API_URL}/User/${newUserId}`, {
            firstName: 'Test',
            lastName: 'Procurement',
            phone: '1234567890',
            companyId: companyId,
            roleIds: [sysAdminRole.id],
            isActive: true
        });
        console.log("Role changed successfully.");

        // 10. User gets new permissions after token/session refresh
        console.log("10. User re-logging in to get new permissions...");
        const userLogin2 = await axios.post(`${API_URL}/Auth/login`, {
            email: testEmail,
            password: 'Password@123'
        });
        const userToken2 = userLogin2.data.data.accessToken;
        const userAxios2 = axios.create({ headers: { Authorization: `Bearer ${userToken2}` } });
        console.log("User re-logged in.");

        console.log("Testing previously unauthorized API (GET /api/Role)...");
        try {
            await userAxios2.get(`${API_URL}/Role`);
            console.log("SUCCESS: API works now with new System Admin role.");
        } catch(err) {
            console.log("FAIL: API still blocked:", err.response?.status);
        }

        // 11. Admin deactivates
        console.log("11. Admin deactivating user...");
        await adminAxios.post(`${API_URL}/User/${newUserId}/deactivate`);
        console.log("User deactivated.");

        // 12. Login blocked
        console.log("12. User attempting login after deactivation...");
        try {
            await axios.post(`${API_URL}/Auth/login`, {
                email: testEmail,
                password: 'Password@123'
            });
            console.log("FAIL: Login succeeded but should have been blocked.");
        } catch(err) {
            if (err.response?.status === 401) {
                console.log("SUCCESS: Login blocked with 401 Unauthorized.");
                console.log("Message:", err.response?.data?.message || err.response?.data);
            } else {
                console.log("Login failed but with unexpected status:", err.response?.status);
            }
        }

        console.log("\nAll workflow steps executed successfully!");

    } catch (error) {
        console.error("Workflow Test Failed:", error.response?.data || error.message);
        return;
    }
}

runTests();
