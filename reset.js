const {Client}=require('pg');
const c=new Client({host:'localhost',port:5432,database:'NovaERPDB',user:'postgres',password:'balan123'});
async function run(){
  await c.connect();
  await c.query('UPDATE "Inventories" SET "QuantityOnHand"=1000, "QuantityAvailable"=1000, "QuantityReserved"=0');
  await c.query('DELETE FROM "InventoryReservations"');
  await c.query('DELETE FROM "ProductionExecutions"');
  await c.query('DELETE FROM "MaterialConsumptions"');
  await c.end();
}
run();
