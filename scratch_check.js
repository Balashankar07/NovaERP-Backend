const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  const roleRes = await client.query('SELECT "Id" FROM "Roles" WHERE "Name" = \'Procurement Manager\' AND "IsActive" = true LIMIT 1');
  const roleId = roleRes.rows[0].Id;

  const existing = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = \'procurement.manager@novaerp.com\'');
  if (existing.rows.length === 0) {
    const insertUser = await client.query('INSERT INTO "Users" ("Id", "FirstName", "LastName", "Email", "Phone", "PasswordHash", "CompanyId", "IsActive", "CreatedAt") VALUES (gen_random_uuid(), \'Procurement\', \'Manager\', \'procurement.manager@novaerp.com\', \'\', \'hash\', \'00000000-0000-0000-0000-000000000000\', true, NOW()) RETURNING "Id"');
    const userId = insertUser.rows[0].Id;
    await client.query('INSERT INTO "UserRoles" ("Id", "UserId", "RoleId", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, NOW())', [userId, roleId]);
    console.log("✅ Procurement Manager user inserted.");
  } else {
    console.log("Procurement Manager already exists.");
  }

  const users = await client.query('SELECT u."Email", u."FirstName", u."LastName", r."Name" as roleName FROM "Users" u LEFT JOIN "UserRoles" ur ON u."Id" = ur."UserId" LEFT JOIN "Roles" r ON ur."RoleId" = r."Id"');
  console.log("=== USERS IN DB ===");
  console.log(users.rows);

  await client.end();
}

run().catch(console.error);
