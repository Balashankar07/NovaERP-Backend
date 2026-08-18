const {Client}=require("pg");
const fs=require("fs");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});

async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  
  const inv = await q('SELECT i.*, p."Name" as "ProductName", w."WarehouseName" FROM "Inventories" i JOIN "Products" p ON i."ProductId"=p."Id" JOIN "Warehouses" w ON i."WarehouseId"=w."Id"');
  fs.writeFileSync("e:\\Nova\\inventory_backup.json", JSON.stringify(inv, null, 2));
  
  console.log("=== INVENTORY BACKUP SAVED: " + inv.length + " ROWS ===");
  
  const badRecs = inv.filter(r => parseFloat(r.QuantityAvailable) > parseFloat(r.QuantityOnHand));
  console.log("=== INVALID RECORDS (" + badRecs.length + ") ===");
  badRecs.forEach(r => {
    console.log(`ID: ${r.Id}, Product: ${r.ProductName}, Warehouse: ${r.WarehouseName}, QtyOnHand: ${r.QuantityOnHand}, QtyAvail: ${r.QuantityAvailable}, QtyRes: ${r.QuantityReserved}`);
  });
  
  const wh = await q('SELECT COUNT(*) as c FROM "Warehouses"');
  const loc = await q('SELECT COUNT(*) as c FROM "WarehouseLocations"');
  const tx = await q('SELECT COUNT(*) as c FROM "InventoryTransactions"');
  console.log("Warehouses:", wh[0].c, "Locations:", loc[0].c, "Transactions:", tx[0].c);

  // Check where the bad data came from by looking at transactions for these bad records
  console.log("=== TRANSACTIONS FOR INVALID RECORDS ===");
  const badIds = badRecs.map(r=>`'${r.Id}'`).join(",");
  if (badIds.length > 0) {
    const badTx = await q(`SELECT * FROM "InventoryTransactions" WHERE "InventoryId" IN (${badIds})`);
    console.log(`Found ${badTx.length} transactions for the invalid inventory records.`);
    console.log(badTx);
  }

  await c.end();
}
main().catch(console.error);
