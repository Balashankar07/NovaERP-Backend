import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres:balan123@localhost:5432/NovaERPDB";

const canonicalRoles = [
    "System Administrator",
    "Production Manager",
    "Procurement Manager",
    "Warehouse Manager",
    "Quality Engineer",
    "Sales Manager",
    "Finance Manager",
    "Warranty Executive",
    "Distributor"
];

async function fixRoles() {
    const client = new Client({ connectionString });
    await client.connect();

    try {
        const res = await client.query('SELECT "Id", "Name", "IsActive" FROM "Roles"');
        const dbRoles = res.rows;

        console.log("Current DB Roles:", dbRoles);

        for (const dbRole of dbRoles) {
            if (!canonicalRoles.includes(dbRole.Name)) {
                if (dbRole.IsActive) {
                    console.log(`Deprecating legacy role: ${dbRole.Name}`);
                    await client.query('UPDATE "Roles" SET "IsActive" = false WHERE "Id" = $1', [dbRole.Id]);
                }
            }
        }

        const existingNames = dbRoles.map(r => r.Name);
        for (const canRole of canonicalRoles) {
            if (!existingNames.includes(canRole)) {
                console.log(`Inserting missing canonical role: ${canRole}`);
                await client.query('INSERT INTO "Roles" ("Id", "Name", "Description", "IsActive", "CreatedAt") VALUES (gen_random_uuid(), $1, $1, true, NOW())', [canRole]);
            } else {
                const r = dbRoles.find(r => r.Name === canRole);
                if (!r.IsActive) {
                    console.log(`Reactivating canonical role: ${canRole}`);
                    await client.query('UPDATE "Roles" SET "IsActive" = true WHERE "Id" = $1', [r.Id]);
                }
            }
        }

        // Also we must give System Administrator all permissions!
        const sysAdmin = await client.query('SELECT "Id" FROM "Roles" WHERE "Name" = \'System Administrator\'');
        const sysAdminId = sysAdmin.rows[0].Id;
        
        const perms = await client.query('SELECT "Id" FROM "Permissions"');
        for (const p of perms.rows) {
            const hasPerm = await client.query('SELECT 1 FROM "RolePermissions" WHERE "RoleId" = $1 AND "PermissionId" = $2', [sysAdminId, p.Id]);
            if (hasPerm.rowCount === 0) {
                await client.query('INSERT INTO "RolePermissions" ("Id", "RoleId", "PermissionId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [sysAdminId, p.Id]);
            }
        }
        console.log("Granted all permissions to System Administrator.");

        // And grant specific permissions to Procurement Manager for tests
        const procManager = await client.query('SELECT "Id" FROM "Roles" WHERE "Name" = \'Procurement Manager\'');
        if (procManager.rows.length > 0) {
            const procManagerId = procManager.rows[0].Id;
            const supplierViewPerm = await client.query('SELECT "Id" FROM "Permissions" WHERE "Name" = \'Permissions.Suppliers.View\'');
            if (supplierViewPerm.rows.length > 0) {
                const hasPerm = await client.query('SELECT 1 FROM "RolePermissions" WHERE "RoleId" = $1 AND "PermissionId" = $2', [procManagerId, supplierViewPerm.rows[0].Id]);
                if (hasPerm.rowCount === 0) {
                    await client.query('INSERT INTO "RolePermissions" ("Id", "RoleId", "PermissionId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [procManagerId, supplierViewPerm.rows[0].Id]);
                }
            }
        }
        
        // And grant specific permissions to Warehouse Manager for tests
        const whManager = await client.query('SELECT "Id" FROM "Roles" WHERE "Name" = \'Warehouse Manager\'');
        if (whManager.rows.length > 0) {
            const whManagerId = whManager.rows[0].Id;
            const whViewPerm = await client.query('SELECT "Id" FROM "Permissions" WHERE "Name" = \'Permissions.Warehouses.View\'');
            if (whViewPerm.rows.length > 0) {
                const hasPerm = await client.query('SELECT 1 FROM "RolePermissions" WHERE "RoleId" = $1 AND "PermissionId" = $2', [whManagerId, whViewPerm.rows[0].Id]);
                if (hasPerm.rowCount === 0) {
                    await client.query('INSERT INTO "RolePermissions" ("Id", "RoleId", "PermissionId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [whManagerId, whViewPerm.rows[0].Id]);
                }
            }
        }

        // And grant Distributor specific permissions
        const distRole = await client.query('SELECT "Id" FROM "Roles" WHERE "Name" = \'Distributor\'');
        if (distRole.rows.length > 0) {
            const distRoleId = distRole.rows[0].Id;
            const distPerms = ['Permissions.SalesOrders.View', 'Permissions.SalesOrders.Create'];
            for (const dp of distPerms) {
                const p = await client.query('SELECT "Id" FROM "Permissions" WHERE "Name" = $1', [dp]);
                if (p.rows.length > 0) {
                    const hasPerm = await client.query('SELECT 1 FROM "RolePermissions" WHERE "RoleId" = $1 AND "PermissionId" = $2', [distRoleId, p.rows[0].Id]);
                    if (hasPerm.rowCount === 0) {
                        await client.query('INSERT INTO "RolePermissions" ("Id", "RoleId", "PermissionId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [distRoleId, p.rows[0].Id]);
                    }
                }
            }
        }

        // We must also update balashankar07@gmail.com to be a System Administrator because Super Admin is deprecated
        const userRes = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = \'balashankar07@gmail.com\'');
        if (userRes.rows.length > 0) {
            const adminId = userRes.rows[0].Id;
            await client.query('DELETE FROM "UserRoles" WHERE "UserId" = $1', [adminId]);
            await client.query('INSERT INTO "UserRoles" ("Id", "UserId", "RoleId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [adminId, sysAdminId]);
            console.log("Re-assigned balashankar07@gmail.com to System Administrator.");
        }

        console.log("DB Roles fixed.");
    } catch(err) {
        console.error("DB Error:", err);
    } finally {
        await client.end();
    }
}

fixRoles();
