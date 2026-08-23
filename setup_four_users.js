const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Setting up 4 Operational Working Users ===");

  const rolesRes = await client.query('SELECT "Id", "Name" FROM "Roles" WHERE "IsActive" = true');
  const rolesMap = {};
  rolesRes.rows.forEach(r => { rolesMap[r.Name] = r.Id; });

  const sysAdminRoleId = rolesMap['System Administrator'];
  const prodManagerRoleId = rolesMap['Production Manager'];
  const procManagerRoleId = rolesMap['Procurement Manager'];
  const whManagerRoleId = rolesMap['Warehouse Manager'];

  // Clean test accounts
  await client.query('DELETE FROM "UserRoles" WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Email" LIKE \'%1786%\')');
  await client.query('DELETE FROM "Users" WHERE "Email" LIKE \'%1786%\'');

  // 1. System Administrator
  let u1 = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = $1', ['balashankar07@gmail.com']);
  if (u1.rows.length > 0) {
    const userId = u1.rows[0].Id;
    await client.query('DELETE FROM "UserRoles" WHERE "UserId" = $1', [userId]);
    await client.query('INSERT INTO "UserRoles" ("Id", "UserId", "RoleId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [userId, sysAdminRoleId]);
  }

  // 2. Production Manager
  let u2 = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = $1', ['production.manager@novaerp.com']);
  if (u2.rows.length > 0) {
    const userId = u2.rows[0].Id;
    await client.query('DELETE FROM "UserRoles" WHERE "UserId" = $1', [userId]);
    await client.query('INSERT INTO "UserRoles" ("Id", "UserId", "RoleId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [userId, prodManagerRoleId]);
  }

  // 3. Procurement Manager
  let u3 = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = $1', ['procurement.manager@novaerp.com']);
  if (u3.rows.length === 0) {
    await client.query('INSERT INTO "Users" ("Id", "FirstName", "LastName", "Email", "Phone", "PasswordHash", "CompanyId", "IsActive", "CreatedAt") VALUES (gen_random_uuid(), \'Procurement\', \'Manager\', \'procurement.manager@novaerp.com\', \'\', \'hash\', \'00000000-0000-0000-0000-000000000000\', true, NOW())');
    u3 = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = $1', ['procurement.manager@novaerp.com']);
  }
  const u3Id = u3.rows[0].Id;
  await client.query('DELETE FROM "UserRoles" WHERE "UserId" = $1', [u3Id]);
  await client.query('INSERT INTO "UserRoles" ("Id", "UserId", "RoleId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [u3Id, procManagerRoleId]);

  // 4. Warehouse Manager
  let u4 = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = $1', ['warehouse.manager@novaerp.com']);
  if (u4.rows.length === 0) {
    await client.query('INSERT INTO "Users" ("Id", "FirstName", "LastName", "Email", "Phone", "PasswordHash", "CompanyId", "IsActive", "CreatedAt") VALUES (gen_random_uuid(), \'Warehouse\', \'Manager\', \'warehouse.manager@novaerp.com\', \'\', \'hash\', \'00000000-0000-0000-0000-000000000000\', true, NOW())');
    u4 = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = $1', ['warehouse.manager@novaerp.com']);
  }
  const u4Id = u4.rows[0].Id;
  await client.query('DELETE FROM "UserRoles" WHERE "UserId" = $1', [u4Id]);
  await client.query('INSERT INTO "UserRoles" ("Id", "UserId", "RoleId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [u4Id, whManagerRoleId]);

  console.log("=== 4 Operational Users Successfully Provisioned ===");
  await client.end();
}

run().catch(console.error);
