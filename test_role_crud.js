import axios from 'axios';

const API_URL = 'http://localhost:5233/api';

async function testRoleCrud() {
    console.log("=== ROLE CRUD TEST ===");
    try {
        // 1. Login as Admin
        const loginRes = await axios.post(`${API_URL}/Auth/login`, {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        const token = loginRes.data.data.accessToken;
        const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

        // 2. Create Role
        const roleName = `TestRole_${Date.now()}`;
        console.log(`Creating role: ${roleName}`);
        const createRes = await api.post(`${API_URL}/Role`, {
            name: roleName,
            description: "A role for testing CRUD",
            isActive: true
        });
        const newRoleId = createRes.data.data.id;
        console.log(`[PASS] Created Role ID: ${newRoleId}`);

        // 3. Read Role (Get all and verify it's there)
        const getRes = await api.get(`${API_URL}/Role?search=${roleName}`);
        if (getRes.data.data.items.length === 1 && getRes.data.data.items[0].id === newRoleId) {
            console.log(`[PASS] Verified role exists in list.`);
        } else {
            console.error(`[FAIL] Role not found in list.`);
        }

        // 4. Update Role
        console.log(`Updating role: ${newRoleId}`);
        await api.put(`${API_URL}/Role/${newRoleId}`, {
            id: newRoleId,
            name: `${roleName}_Updated`,
            description: "Updated description",
            isActive: false
        });
        console.log(`[PASS] Updated Role successfully.`);

        // 5. Delete Role
        console.log(`Deleting role: ${newRoleId}`);
        await api.delete(`${API_URL}/Role/${newRoleId}`);
        console.log(`[PASS] Deleted Role successfully.`);

        console.log("\nALL ROLE CRUD OPERATIONS SUCCESSFUL.");

    } catch (e) {
        console.error("Test Failed:", e.response ? e.response.data : e.message);
    }
}

testRoleCrud();
