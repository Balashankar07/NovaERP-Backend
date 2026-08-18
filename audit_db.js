const { Client } = require('pg');

async function run() {
  const client = new Client({connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB'});
  await client.connect();

  console.log('=== 1. FINISHED GOODS ===');
  const fg = await client.query(`
    SELECT p."ProductNumber", p."ProductCode", p."SKU", p."Barcode", p."Name", b."Name" as "Brand", p."Type"
    FROM "Products" p
    JOIN "Brands" b ON b."Id" = p."BrandId"
    WHERE p."Type" = 1 AND p."IsActive" = TRUE
    ORDER BY p."ProductCode";
  `);
  fg.rows.forEach(r => console.log(JSON.stringify(r)));

  console.log('\n=== 2. COMPONENTS ===');
  const totalComp = await client.query(`SELECT COUNT(*) as count FROM "Products" WHERE "Type" = 2;`);
  
  const bomRefComp = await client.query(`
    SELECT COUNT(DISTINCT bi."RawMaterialProductId") as count 
    FROM "BOMItems" bi
    JOIN "Products" p ON p."Id" = bi."RawMaterialProductId"
    WHERE p."Type" = 2;
  `);

  const unrefComp = await client.query(`
    SELECT COUNT(p."Id") as count 
    FROM "Products" p
    LEFT JOIN "BOMItems" bi ON bi."RawMaterialProductId" = p."Id"
    WHERE p."Type" = 2 AND bi."Id" IS NULL;
  `);

  console.log(`Total Components: ${totalComp.rows[0].count}`);
  console.log(`BOM-referenced: ${bomRefComp.rows[0].count}`);
  console.log(`Unreferenced: ${unrefComp.rows[0].count}`);

  console.log('\n=== 3. IDENTIFIER SEQUENCES ===');
  const seqs = await client.query(`
    SELECT sequencename, last_value 
    FROM pg_sequences 
    WHERE sequencename IN ('ProductNumberSeq', 'ProductCodeSeq', 'SkuSeq', 'BarcodeSeq')
    ORDER BY sequencename;
  `);
  seqs.rows.forEach(r => console.log(JSON.stringify(r)));

  console.log('\n=== 11. BOM INTEGRATION ===');
  const totalFGs = await client.query(`SELECT COUNT(*) as count FROM "Products" WHERE "Type" = 1;`);
  const totalBOMs = await client.query(`SELECT COUNT(*) as count FROM "BOMs";`);
  const totalBOMItems = await client.query(`SELECT COUNT(*) as count FROM "BOMItems";`);
  const totalRequiredComps = await client.query(`SELECT COUNT(DISTINCT "RawMaterialProductId") as count FROM "BOMItems";`);
  
  const orphanBOMs = await client.query(`SELECT COUNT(*) as count FROM "BOMs" WHERE "ProductId" NOT IN (SELECT "Id" FROM "Products");`);
  const orphanBOMItems = await client.query(`SELECT COUNT(*) as count FROM "BOMItems" WHERE "BomId" NOT IN (SELECT "Id" FROM "BOMs");`);
  const orphanRawMaterials = await client.query(`SELECT COUNT(*) as count FROM "BOMItems" WHERE "RawMaterialProductId" NOT IN (SELECT "Id" FROM "Products");`);

  console.log(`FinishedGoods: ${totalFGs.rows[0].count}`);
  console.log(`BOMs: ${totalBOMs.rows[0].count}`);
  console.log(`BOMItems: ${totalBOMItems.rows[0].count}`);
  console.log(`Required Components: ${totalRequiredComps.rows[0].count}`);
  console.log(`Orphan BOMs: ${orphanBOMs.rows[0].count}`);
  console.log(`Orphan BOMItems: ${orphanBOMItems.rows[0].count}`);
  console.log(`Orphan Raw Materials: ${orphanRawMaterials.rows[0].count}`);

  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
