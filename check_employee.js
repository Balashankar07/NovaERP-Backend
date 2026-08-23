const { Client } = require('pg');
async function run() {
  const c = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await c.connect();
  const res = await c.query("SELECT u.\"Email\", r.\"Name\" as roleName FROM \"Users\" u JOIN \"UserRoles\" ur ON u.\"Id\" = ur.\"UserId\" JOIN \"Roles\" r ON ur.\"RoleId\" = r.\"Id\" WHERE u.\"Email\" = 'employee@novaerp.com'");
  console.table(res.rows);
  await c.end();
}
run();
