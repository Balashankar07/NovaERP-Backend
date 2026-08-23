const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:balan123@localhost:5432/NovaERPDB' });
  await client.connect();

  console.log("=== Cleaning up hardcoded audit data and provisioning real devices & BOM components ===");

  // 1. Delete audit BOM items, BOMs, products
  const auditProductIds = await client.query(`
    SELECT "Id" FROM "Products" 
    WHERE "Name" LIKE '%Audit%' OR "Name" LIKE 'FG With BOM' OR "SKU" LIKE 'F-10%' OR "SKU" LIKE 'C-10%' OR "SKU" LIKE 'FWB-%'
  `);
  const ids = auditProductIds.rows.map(r => r.Id);

  if (ids.length > 0) {
    // Delete foreign references
    await client.query('DELETE FROM "BOMItems" WHERE "ComponentId" = ANY($1) OR "BOMId" IN (SELECT "Id" FROM "BOMs" WHERE "ProductId" = ANY($1))', [ids]);
    await client.query('DELETE FROM "BOMs" WHERE "ProductId" = ANY($1)', [ids]);
    await client.query('DELETE FROM "InventoryTransactions" WHERE "InventoryId" IN (SELECT "Id" FROM "Inventory" WHERE "ProductId" = ANY($1))', [ids]);
    await client.query('DELETE FROM "Inventory" WHERE "ProductId" = ANY($1)', [ids]);
    await client.query('DELETE FROM "PurchaseOrderItems" WHERE "ProductId" = ANY($1)', [ids]);
    await client.query('DELETE FROM "PurchaseRequestItems" WHERE "ProductId" = ANY($1)', [ids]);
    await client.query('DELETE FROM "ProductionExecutions" WHERE "ProductionOrderId" IN (SELECT "Id" FROM "ProductionOrders" WHERE "ProductId" = ANY($1))', [ids]);
    await client.query('DELETE FROM "ProductionOrders" WHERE "ProductId" = ANY($1)', [ids]);
    await client.query('DELETE FROM "Products" WHERE "Id" = ANY($1)', [ids]);
    console.log(`✅ Removed ${ids.length} hardcoded audit products and their associated records.`);
  }

  // Helper to upsert a product
  async function upsertProduct(sku, name, description, category, unit, costPrice, sellingPrice, type) {
    const existing = await client.query('SELECT "Id" FROM "Products" WHERE "SKU" = $1 OR "Name" = $2', [sku, name]);
    if (existing.rows.length > 0) {
      const id = existing.rows[0].Id;
      await client.query(
        'UPDATE "Products" SET "Name" = $1, "Description" = $2, "Category" = $3, "Unit" = $4, "CostPrice" = $5, "SellingPrice" = $6, "Type" = $7, "IsActive" = true WHERE "Id" = $8',
        [name, description, category, unit, costPrice, sellingPrice, type, id]
      );
      return id;
    } else {
      const inserted = await client.query(
        'INSERT INTO "Products" ("Id", "SKU", "Name", "Description", "Category", "Unit", "CostPrice", "SellingPrice", "Type", "IsActive", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, NOW()) RETURNING "Id"',
        [sku, name, description, category, unit, costPrice, sellingPrice, type]
      );
      return inserted.rows[0].Id;
    }
  }

  // 2. Provision Real Devices (Finished Goods)
  const devices = [
    { sku: 'BS-1000', name: 'Bluetooth Speaker', desc: 'Portable wireless Bluetooth 5.2 speaker with 12h battery life', category: 'Audio Devices', unit: 'PCS', cost: 45.00, price: 89.99, type: 'FinishedGood' },
    { sku: 'WE-1001', name: 'Wireless Earbuds', desc: 'Active noise cancelling TWS Bluetooth earbuds', category: 'Audio Devices', unit: 'PCS', cost: 35.00, price: 79.99, type: 'FinishedGood' },
    { sku: 'SW-1002', name: 'Smartwatch', desc: 'Fitness tracking smartwatch with heart rate monitor & OLED display', category: 'Wearable Tech', unit: 'PCS', cost: 65.00, price: 129.99, type: 'FinishedGood' },
    { sku: 'PB-1003', name: 'Power Bank', desc: 20000 + 'mAh fast charging PD power bank', category: 'Power Electronics', unit: 'PCS', cost: 18.00, price: 39.99, type: 'FinishedGood' },
    { sku: 'NB-1004', name: 'Neckband Headphones', desc: 'Magnetic neckband wireless earphones with HD mic', category: 'Audio Devices', unit: 'PCS', cost: 22.00, price: 49.99, type: 'FinishedGood' },
    { sku: 'GW-2000', name: 'Industrial IoT Gateway', desc: 'Multi-protocol Linux edge gateway with RS485 & cellular modem', category: 'Industrial Devices', unit: 'PCS', cost: 180.00, price: 349.99, type: 'FinishedGood' },
    { sku: 'SEM-3000', name: 'Smart Energy Meter', desc: 'Three-phase smart electric energy meter with RS485 Modbus', category: 'Metering Devices', unit: 'PCS', cost: 95.00, price: 199.99, type: 'FinishedGood' }
  ];

  const deviceMap = {};
  for (const d of devices) {
    const id = await upsertProduct(d.sku, d.name, d.desc, d.category, d.unit, d.cost, d.price, d.type);
    deviceMap[d.sku] = id;
  }

  // 3. Provision Real Raw Components
  const rawComponents = [
    { sku: 'COMP-BAT-01', name: 'Lithium-Ion Battery 3.7V 3000mAh', desc: 'Rechargeable Li-ion battery cell with protection circuit', category: 'Energy Storage', unit: 'PCS', cost: 8.50, price: 15.00, type: 'RawMaterial' },
    { sku: 'COMP-MCU-01', name: 'Bluetooth 5.2 SoC Microcontroller', desc: 'Low energy Bluetooth wireless SoC IC', category: 'Semiconductors', unit: 'PCS', cost: 4.20, price: 8.00, type: 'RawMaterial' },
    { sku: 'COMP-SPK-01', name: 'Neodymium Speaker Driver 45mm', desc: '4 Ohm 5W full-range acoustic neodymium speaker transducer', category: 'Acoustic Components', unit: 'PCS', cost: 5.80, price: 11.00, type: 'RawMaterial' },
    { sku: 'COMP-DSP-01', name: 'OLED Display Module 1.3-inch', desc: '128x64 resolution monochrome I2C OLED display', category: 'Displays', unit: 'PCS', cost: 6.00, price: 12.00, type: 'RawMaterial' },
    { sku: 'COMP-ENC-01', name: 'ABS Plastic Enclosure Casing', desc: 'Precision molded impact-resistant ABS housing', category: 'Enclosures', unit: 'PCS', cost: 3.50, price: 7.00, type: 'RawMaterial' },
    { sku: 'COMP-PWR-01', name: 'USB-C Charging & Power Management Board', desc: 'Power delivery controller PCB with USB-C connector', category: 'PCB Assembly', unit: 'PCS', cost: 3.80, price: 7.50, type: 'RawMaterial' },
    { sku: 'COMP-MCU-02', name: 'ARM Cortex-M4 Microcontroller MCU', desc: '32-bit RISC MCU 168MHz with 512KB Flash', category: 'Semiconductors', unit: 'PCS', cost: 7.40, price: 14.00, type: 'RawMaterial' },
    { sku: 'COMP-PAS-01', name: 'SMD Resistors & Capacitors Kit', desc: 'Surface mount passive component array kit', category: 'Passives', unit: 'SET', cost: 1.20, price: 2.50, type: 'RawMaterial' },
    { sku: 'COMP-ACC-01', name: 'Silicone Ear Tips & Flex Cable Set', desc: 'Soft ergonomic silicone tips and high-flex neckband wire', category: 'Accessories', unit: 'SET', cost: 2.10, price: 4.50, type: 'RawMaterial' },
    { sku: 'COMP-SEN-01', name: 'Current Transformer & Metering Sensor', desc: 'High accuracy energy metering sensor transformer', category: 'Sensors', unit: 'PCS', cost: 12.00, price: 24.00, type: 'RawMaterial' }
  ];

  const compMap = {};
  for (const c of rawComponents) {
    const id = await upsertProduct(c.sku, c.name, c.desc, c.category, c.unit, c.cost, c.price, c.type);
    compMap[c.sku] = id;
  }

  // 4. Provision BOMs & BOMItems for each real device
  const bomsDefinition = [
    {
      deviceSku: 'BS-1000',
      version: '1.0',
      items: [
        { compSku: 'COMP-BAT-01', qty: 1, scrapPct: 0.5 },
        { compSku: 'COMP-MCU-01', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-SPK-01', qty: 2, scrapPct: 0.0 },
        { compSku: 'COMP-ENC-01', qty: 1, scrapPct: 1.0 },
        { compSku: 'COMP-PWR-01', qty: 1, scrapPct: 0.0 }
      ]
    },
    {
      deviceSku: 'WE-1001',
      version: '1.0',
      items: [
        { compSku: 'COMP-BAT-01', qty: 2, scrapPct: 0.5 },
        { compSku: 'COMP-MCU-01', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-SPK-01', qty: 2, scrapPct: 0.0 },
        { compSku: 'COMP-ACC-01', qty: 1, scrapPct: 0.5 }
      ]
    },
    {
      deviceSku: 'SW-1002',
      version: '1.0',
      items: [
        { compSku: 'COMP-MCU-02', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-DSP-01', qty: 1, scrapPct: 0.5 },
        { compSku: 'COMP-BAT-01', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-ENC-01', qty: 1, scrapPct: 1.0 },
        { compSku: 'COMP-PAS-01', qty: 1, scrapPct: 0.0 }
      ]
    },
    {
      deviceSku: 'PB-1003',
      version: '1.0',
      items: [
        { compSku: 'COMP-BAT-01', qty: 4, scrapPct: 0.5 },
        { compSku: 'COMP-PWR-01', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-ENC-01', qty: 1, scrapPct: 1.0 }
      ]
    },
    {
      deviceSku: 'NB-1004',
      version: '1.0',
      items: [
        { compSku: 'COMP-BAT-01', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-MCU-01', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-SPK-01', qty: 2, scrapPct: 0.0 },
        { compSku: 'COMP-ACC-01', qty: 1, scrapPct: 0.5 }
      ]
    },
    {
      deviceSku: 'GW-2000',
      version: '1.0',
      items: [
        { compSku: 'COMP-MCU-02', qty: 2, scrapPct: 0.0 },
        { compSku: 'COMP-PWR-01', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-ENC-01', qty: 1, scrapPct: 0.5 },
        { compSku: 'COMP-PAS-01', qty: 2, scrapPct: 0.0 }
      ]
    },
    {
      deviceSku: 'SEM-3000',
      version: '1.0',
      items: [
        { compSku: 'COMP-MCU-02', qty: 1, scrapPct: 0.0 },
        { compSku: 'COMP-SEN-01', qty: 3, scrapPct: 0.0 },
        { compSku: 'COMP-DSP-01', qty: 1, scrapPct: 0.5 },
        { compSku: 'COMP-ENC-01', qty: 1, scrapPct: 0.5 }
      ]
    }
  ];

  for (const b of bomsDefinition) {
    const deviceId = deviceMap[b.deviceSku];
    if (!deviceId) continue;

    let bomRes = await client.query('SELECT "Id" FROM "BOMs" WHERE "ProductId" = $1', [deviceId]);
    let bomId;
    if (bomRes.rows.length > 0) {
      bomId = bomRes.rows[0].Id;
      await client.query('UPDATE "BOMs" SET "Version" = $1, "IsActive" = true WHERE "Id" = $2', [b.version, bomId]);
    } else {
      const newBom = await client.query(
        'INSERT INTO "BOMs" ("Id", "ProductId", "Version", "IsActive", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, true, NOW()) RETURNING "Id"',
        [deviceId, b.version]
      );
      bomId = newBom.rows[0].Id;
    }

    // Replace BOMItems cleanly
    await client.query('DELETE FROM "BOMItems" WHERE "BOMId" = $1', [bomId]);

    for (const item of b.items) {
      const compId = compMap[item.compSku];
      if (compId) {
        await client.query(
          'INSERT INTO "BOMItems" ("Id", "BOMId", "ComponentId", "Quantity", "ScrapPercentage", "CreatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())',
          [bomId, compId, item.qty, item.scrapPct]
        );
      }
    }
    console.log(`✅ Provisioned BOM for device: ${b.deviceSku} with ${b.items.length} components.`);
  }

  console.log("=== Provisioning Complete! Real Devices and Component BOMs are active ===");
  await client.end();
}

run().catch(console.error);
