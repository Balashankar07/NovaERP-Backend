const { Client } = require("pg");
const c = new Client({ host: "localhost", port: 5432, database: "NovaERPDB", user: "postgres", password: "balan123" });

async function main() {
    await c.connect();
    
    // No duplicate email
    const duplicateEmails = await c.query('SELECT "Email", COUNT(*) FROM "Users" GROUP BY "Email" HAVING COUNT(*) > 1');
    if (duplicateEmails.rows.length > 0) throw new Error("Duplicate Emails found");
    
    // No duplicate GoogleSubjectId
    const duplicateGoogle = await c.query('SELECT "GoogleSubjectId", COUNT(*) FROM "Users" WHERE "GoogleSubjectId" IS NOT NULL GROUP BY "GoogleSubjectId" HAVING COUNT(*) > 1');
    if (duplicateGoogle.rows.length > 0) throw new Error("Duplicate GoogleSubjectIds found");
    
    // No orphan UserRole
    const orphanUserRoles = await c.query('SELECT * FROM "UserRoles" WHERE "UserId" NOT IN (SELECT "Id" FROM "Users")');
    if (orphanUserRoles.rows.length > 0) throw new Error("Orphan UserRoles found");
    
    // No invalid RoleId
    const invalidRoles = await c.query('SELECT * FROM "UserRoles" WHERE "RoleId" NOT IN (SELECT "Id" FROM "Roles")');
    if (invalidRoles.rows.length > 0) throw new Error("Invalid RoleId found");
    
    // No invalid CompanyId
    const invalidCompanies = await c.query('SELECT * FROM "Users" WHERE "CompanyId" NOT IN (SELECT "Id" FROM "Companies")');
    if (invalidCompanies.rows.length > 0) throw new Error("Invalid CompanyId found");
    
    console.log("✅ DATABASE INTEGRITY PASSED");
    
    await c.end();
}

main().catch(err => {
    console.error("❌ INTEGRITY FAIL:", err);
    process.exit(1);
});
