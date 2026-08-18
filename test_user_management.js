import axios from 'axios';
import assert from 'assert';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log("Starting User Management Tests...");

    let token = '';

    // Login as System Administrator (from seed)
    try {
        const loginRes = await axios.post(`${API_URL}/Auth/login`, {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        token = loginRes.data.data.token;
        console.log("TEST A: Admin login successful.");
    } catch (err) {
        console.error("TEST A FAILED: Could not login as admin.", err.message);
        return;
    }

    const axiosInstance = axios.create({
        headers: { Authorization: `Bearer ${token}` }
    });

    let createdUserId = '';
    const testEmail = 'newbalashankar07@gmail.com';

    // Test Create User
    try {
        const rolesRes = await axiosInstance.get(`${API_URL}/Role`);
        const sysAdminRole = rolesRes.data.data.items.find((r) => r.name === 'System Administrator');
        assert(sysAdminRole, "System Administrator role not found");

        const userRes = await axiosInstance.post(`${API_URL}/User`, {
            firstName: 'New',
            lastName: 'Admin',
            email: testEmail,
            phone: '1234567890',
            password: 'Password@123',
            companyId: '00000000-0000-0000-0000-000000000000', // Needs a real company ID but let's see if it works without
            roleIds: [sysAdminRole.id]
        });
        
        createdUserId = userRes.data.data.id;
        console.log("TEST B: Create User successful.");
    } catch (err) {
        console.log("TEST B FAILED or skipped if already exists:", err.response?.data || err.message);
    }

    // Test deactivate user
    if (createdUserId) {
        try {
            await axiosInstance.post(`${API_URL}/User/${createdUserId}/deactivate`);
            console.log("TEST C: Deactivate User successful.");
        } catch (err) {
            console.error("TEST C FAILED:", err.message);
        }
    }

    console.log("All automated tests completed.");
}

runTests();
