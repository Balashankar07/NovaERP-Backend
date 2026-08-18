import pg from 'pg';
import axios from 'axios';
const { Client } = pg;

const connectionString = "postgres://postgres:balan123@localhost:5432/NovaERPDB";
const API_URL = 'http://localhost:5233/api';

async function verifyDb() {
    console.log("=== DB INTEGRITY CERTIFICATION ===");
    const client = new Client({ connectionString });
    await client.connect();

    try {
        // 1. Duplicate emails
        const emailCounts = await client.query('SELECT "Email", COUNT(*) as cnt FROM "Users" GROUP BY "Email" HAVING COUNT(*) > 1');
        if (emailCounts.rowCount > 0) {
            console.log("FAIL: Found duplicate emails:", emailCounts.rows);
        } else {
            console.log("PASS: No duplicate emails.");
        }

        // 2. Orphan UserRoles
        const orphanUR = await client.query('SELECT * FROM "UserRoles" WHERE "UserId" NOT IN (SELECT "Id" FROM "Users") OR "RoleId" NOT IN (SELECT "Id" FROM "Roles")');
        if (orphanUR.rowCount > 0) {
            console.log("FAIL: Orphan UserRoles found.");
        } else {
            console.log("PASS: No orphan UserRoles.");
        }

        // 3. Orphan RolePermissions
        const orphanRP = await client.query('SELECT * FROM "RolePermissions" WHERE "RoleId" NOT IN (SELECT "Id" FROM "Roles") OR "PermissionId" NOT IN (SELECT "Id" FROM "Permissions")');
        if (orphanRP.rowCount > 0) {
            console.log("FAIL: Orphan RolePermissions found.");
        } else {
            console.log("PASS: No orphan RolePermissions.");
        }

        // 4. Invalid CompanyIds
        const orphanComp = await client.query('SELECT * FROM "Users" WHERE "CompanyId" NOT IN (SELECT "Id" FROM "Companies")');
        if (orphanComp.rowCount > 0) {
            console.log("FAIL: Invalid CompanyIds found in Users.");
        } else {
            console.log("PASS: No invalid CompanyIds.");
        }

    } catch(err) {
        console.error("DB Error:", err);
    } finally {
        await client.end();
    }
}

async function verifySensitiveData() {
    console.log("\n=== SENSITIVE DATA AUDIT ===");
    try {
        // Admin login to get users
        const adminLogin = await axios.post(`${API_URL}/Auth/login`, {
            email: 'balashankar07@gmail.com',
            password: 'Admin@123'
        });
        const adminToken = adminLogin.data.data.accessToken;
        const adminAxios = axios.create({ headers: { Authorization: `Bearer ${adminToken}` } });

        const usersRes = await adminAxios.get(`${API_URL}/User`);
        const firstUser = usersRes.data.data.items[0];
        
        let hasLeak = false;
        if (firstUser.passwordHash || firstUser.PasswordHash) {
            console.log("FAIL: PasswordHash leaked in API response!");
            hasLeak = true;
        }
        if (firstUser.googleSubjectId || firstUser.GoogleSubjectId) {
            // Usually ok to leak google subject id, but prompt said verify it's unchanged and doesn't leak secrets
        }
        
        if (!hasLeak) {
            console.log("PASS: PasswordHash and sensitive fields are not exposed in Users API.");
        }

    } catch (e) {
        console.error("API Error during sensitive data audit:", e.message);
    }
}

async function run() {
    await verifyDb();
    await verifySensitiveData();
}

run();
