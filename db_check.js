const { Client } = require('pg');
async function run() {
  const c = new Client({ host: 'localhost', database: 'NovaERPDB', user: 'postgres', password: 'balan123' });
  await c.connect();
  const res1 = await c.query('SELECT "Email", count(*) FROM "Users" GROUP BY "Email" HAVING count(*) > 1');
  console.log('Duplicates email:', res1.rows);
  const res2 = await c.query('SELECT "GoogleSubjectId", count(*) FROM "Users" WHERE "GoogleSubjectId" IS NOT NULL AND "GoogleSubjectId" != \'\' GROUP BY "GoogleSubjectId" HAVING count(*) > 1');
  console.log('Duplicates Google ID:', res2.rows);
  const res3 = await c.query('SELECT * FROM "UserRoles" ur LEFT JOIN "Roles" r ON ur."RoleId" = r."Id" WHERE r."Id" IS NULL');
  console.log('Orphan UserRoles:', res3.rows);
  const res4 = await c.query('SELECT * FROM "Users" u LEFT JOIN "Companies" c ON u."CompanyId" = c."Id" WHERE c."Id" IS NULL');
  console.log('Invalid CompanyId:', res4.rows);
  await c.end();
}
run().catch(console.error);
