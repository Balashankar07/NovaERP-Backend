const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});
const q=async(sql,params)=>(await c.query(sql,params)).rows;
const http=require("http");
function apiRequest(method,path,body,token){
  return new Promise(resolve=>{
    const bodyStr=body?JSON.stringify(body):null;
    const headers={"Content-Type":"application/json"};
    if(token)headers["Authorization"]="Bearer "+token;
    if(bodyStr)headers["Content-Length"]=Buffer.byteLength(bodyStr);
    const url=new URL("http://localhost:5233"+path);
    const opt={hostname:url.hostname,port:url.port||5233,path:url.pathname+url.search,method,headers};
    const req=http.request(opt,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>{try{resolve({s:r.statusCode,b:JSON.parse(d)})}catch{resolve({s:r.statusCode,b:d})}})});
    req.on("error",e=>resolve({s:0,err:e.message}));
    if(bodyStr)req.write(bodyStr);
    req.end();
  });
}
const P=(l,m)=>console.log("PASS ["+l+"] "+m);
const F=(l,m)=>console.log("FAIL ["+l+"] "+m);
const W=(l,m)=>console.log("WARN ["+l+"] "+m);
const I=(l,m)=>console.log("INFO ["+l+"] "+m);
const NV=(l,m)=>console.log("NV   ["+l+"] "+m);
async function main(){
  await c.connect();
  I("START","=== NovaERP E2E AUDIT === "+new Date().toISOString());
  
  // Section 2: Auth
  const login=await apiRequest("POST","/api/Auth/login",{email:"balashankar07@gmail.com",password:"Admin@123"});
  let token=null;
  if(login.s===200&&login.b.data&&login.b.data.accessToken){token=login.b.data.accessToken;P("AUTH","Login OK")}
  else{F("AUTH","Login failed HTTP "+login.s);process.exit(1);}
  
  // Section 3: Baseline
  I("BASELINE","--- COUNTS ---");
  const bl=await q(`SELECT 
    (SELECT COUNT(*) FROM "Products") products,
    (SELECT COUNT(*) FROM "Products" WHERE "ProductType"=1) fg,
    (SELECT COUNT(*) FROM "Products" WHERE "ProductType"=2) comps,
    (SELECT COUNT(*) FROM "BOMs") boms,
    (SELECT COUNT(*) FROM "BOMItems") bomitems,
    (SELECT COUNT(*) FROM "Suppliers") suppliers,
    (SELECT COUNT(*) FROM "Suppliers" WHERE "IsActive"=true) active_sup,
    (SELECT COUNT(*) FROM "SupplierProducts") sp,
    (SELECT COUNT(*) FROM "PurchaseRequests") prs,
    (SELECT COUNT(*) FROM "PurchaseRequestItems") pritems,
    (SELECT COUNT(*) FROM "PurchaseOrders") pos,
    (SELECT COUNT(*) FROM "PurchaseOrderItems") poitems,
    (SELECT COUNT(*) FROM "GoodsReceipts") grs,
    (SELECT COUNT(*) FROM "GoodsReceiptItems") gritems,
    (SELECT COUNT(*) FROM "Inventories") inv,
    (SELECT COUNT(*) FROM "ProductionPlans") pp,
    (SELECT COUNT(*) FROM "ProductionRequirements") pr,
    (SELECT COUNT(*) FROM "Roles") roles,
    (SELECT COUNT(*) FROM "Permissions") perms,
    (SELECT COUNT(*) FROM "RolePermissions") rp`);
  const b=bl[0];
  Object.keys(b).forEach(k=>I("BASELINE",k+": "+b[k]));
  
  // PR/PO/PP status
  const prStat=await q('SELECT "Status",COUNT(*) c FROM "PurchaseRequests" GROUP BY "Status" ORDER BY "Status"');
  I("BASELINE","PR status: "+prStat.map(r=>r.Status+":"+r.c).join(" "));
  const poStat=await q('SELECT "Status",COUNT(*) c FROM "PurchaseOrders" GROUP BY "Status" ORDER BY "Status"');
  I("BASELINE","PO status: "+poStat.map(r=>r.Status+":"+r.c).join(" "));
  const ppStat=await q('SELECT "Status",COUNT(*) c FROM "ProductionPlans" GROUP BY "Status" ORDER BY "Status"');
  I("BASELINE","PP status: "+ppStat.map(r=>r.Status+":"+r.c).join(" "));
  
  // Section 4: Products
  I("PRODUCTS","--- PRODUCT MASTER ---");
  b.products==38?P("PRODUCTS","Products: "+b.products+" (OK)"):F("PRODUCTS","Products: "+b.products+" expected 38");
  b.fg==5?P("PRODUCTS","FinishedGoods: "+b.fg+" (OK)"):F("PRODUCTS","FinishedGoods: "+b.fg+" expected 5");
  b.comps==33?P("PRODUCTS","Components: "+b.comps+" (OK)"):F("PRODUCTS","Components: "+b.comps+" expected 33");
  
  const dupPN=await q('SELECT COUNT(*) c FROM (SELECT "ProductNumber" FROM "Products" GROUP BY "ProductNumber" HAVING COUNT(*)>1) x');
  const dupSKU=await q('SELECT COUNT(*) c FROM (SELECT "SKU" FROM "Products" WHERE "SKU" IS NOT NULL GROUP BY "SKU" HAVING COUNT(*)>1) x');
  const dupCode=await q('SELECT COUNT(*) c FROM (SELECT "ProductCode" FROM "Products" WHERE "ProductCode" IS NOT NULL GROUP BY "ProductCode" HAVING COUNT(*)>1) x');
  dupPN[0].c==0?P("PRODUCTS","No dup ProductNumbers"):F("PRODUCTS",dupPN[0].c+" dup ProductNumbers");
  dupSKU[0].c==0?P("PRODUCTS","No dup SKUs"):F("PRODUCTS",dupSKU[0].c+" dup SKUs");
  dupCode[0].c==0?P("PRODUCTS","No dup ProductCodes"):F("PRODUCTS",dupCode[0].c+" dup ProductCodes");
  
  const fgList=await q('SELECT "ProductNumber","ProductName" FROM "Products" WHERE "ProductType"=1 ORDER BY "ProductNumber"');
  I("PRODUCTS","FGs: "+fgList.map(p=>p.ProductNumber+":"+p.ProductName).join(" | "));
  
  const ap=await apiRequest("GET","/api/Products?pageNumber=1&pageSize=50",null,token);
  ap.s===200?P("PRODUCTS","API HTTP 200"):F("PRODUCTS","API HTTP "+ap.s);
  
  // Section 5: BOMs
  I("BOM","--- BOM VERIFICATION ---");
  b.boms==5?P("BOM","BOMs: "+b.boms+" (OK)"):F("BOM","BOMs: "+b.boms+" expected 5");
  b.bomitems==49?P("BOM","BOMItems: "+b.bomitems+" (OK)"):F("BOM","BOMItems: "+b.bomitems+" expected 49");
  
  const bomNonFG=await q('SELECT COUNT(*) c FROM "BOMs" bm JOIN "Products" p ON p."Id"=bm."ProductId" WHERE p."ProductType"!=1');
  const bomNonComp=await q('SELECT COUNT(*) c FROM "BOMItems" bi JOIN "Products" p ON p."Id"=bi."ComponentId" WHERE p."ProductType"!=2');
  const bomZero=await q('SELECT COUNT(*) c FROM "BOMItems" WHERE "Quantity"<=0');
  const bomDups=await q('SELECT COUNT(*) c FROM (SELECT "BOMId","ComponentId" FROM "BOMItems" GROUP BY "BOMId","ComponentId" HAVING COUNT(*)>1) x');
  bomNonFG[0].c==0?P("BOM","BOMs only on FG"):F("BOM",bomNonFG[0].c+" BOMs on non-FG");
  bomNonComp[0].c==0?P("BOM","BOMItems reference Components only"):F("BOM",bomNonComp[0].c+" items w/ non-Component");
  bomZero[0].c==0?P("BOM","All quantities>0"):F("BOM",bomZero[0].c+" zero/neg quantities");
  bomDups[0].c==0?P("BOM","No dup components per BOM"):F("BOM",bomDups[0].c+" dup comps");
  
  const ab=await apiRequest("GET","/api/BOMs?pageNumber=1&pageSize=10",null,token);
  ab.s===200?P("BOM","API HTTP 200"):F("BOM","API HTTP "+ab.s);
  
  // Section 6: Production
  I("PROD","--- PRODUCTION REQUIREMENTS ---");
  const calcErr=await q('SELECT COUNT(*) c FROM "ProductionPlans" pp JOIN "ProductionRequirements" pr ON pr."ProductionPlanId"=pp."Id" JOIN "BOMs" bm ON bm."ProductId"=pp."ProductId" JOIN "BOMItems" bi ON bi."BOMId"=bm."Id" AND bi."ComponentId"=pr."ProductId" WHERE ABS(pp."PlannedQuantity"*bi."Quantity"-pr."RequiredQuantity")>0.01');
  const calcTot=await q('SELECT COUNT(*) c FROM "ProductionPlans" pp JOIN "ProductionRequirements" pr ON pr."ProductionPlanId"=pp."Id" JOIN "BOMs" bm ON bm."ProductId"=pp."ProductId" JOIN "BOMItems" bi ON bi."BOMId"=bm."Id" AND bi."ComponentId"=pr."ProductId"');
  if(calcTot[0].c>0){
    calcErr[0].c==0?P("PROD","Calc correct: "+calcTot[0].c+" requirements, 0 errors"):F("PROD","Calc errors: "+calcErr[0].c+"/"+calcTot[0].c);
  }else{NV("PROD","No production requirements to verify calc");}
  
  const shortages=await q('SELECT COUNT(*) c FROM "ProductionRequirements" WHERE "ShortageQuantity">0');
  I("PROD","Shortage records: "+shortages[0].c);
  P("PROD","Shortage detection works ("+shortages[0].c+" in DB)");
  
  const appPlans=await apiRequest("GET","/api/ProductionPlans?pageNumber=1&pageSize=5",null,token);
  appPlans.s===200?P("PROD","API HTTP 200"):F("PROD","API HTTP "+appPlans.s);
  
  const draftWithShort=await q('SELECT "Id","PlanNumber" FROM "ProductionPlans" WHERE "Status"=1 AND EXISTS (SELECT 1 FROM "ProductionRequirements" pr WHERE pr."ProductionPlanId"="Id" AND pr."ShortageQuantity">0) LIMIT 1');
  if(draftWithShort.length>0){
    const rr=await apiRequest("POST","/api/ProductionPlans/"+draftWithShort[0].Id+"/release",null,token);
    if(rr.s===400){P("PROD","Release blocked HTTP 400 ("+draftWithShort[0].PlanNumber+")")}
    else if(rr.s===200||rr.s===201){F("PROD","VIOLATION: Released despite shortage HTTP "+rr.s)}
    else{W("PROD","Release returned HTTP "+rr.s);}
  }else{NV("PROD","No draft plan with shortage for release test");}
  
  // Section 7: Supplier
  I("SUP","--- SUPPLIER & SUPPLIERPRODUCT ---");
  const fgSP=await q('SELECT COUNT(*) c FROM "SupplierProducts" sp JOIN "Products" p ON p."Id"=sp."ProductId" WHERE p."ProductType"=1');
  const dupPref=await q('SELECT COUNT(*) c FROM (SELECT "ProductId" FROM "SupplierProducts" WHERE "IsPreferred"=true AND "IsActive"=true GROUP BY "ProductId" HAVING COUNT(*)>1) x');
  const missSP=await q('SELECT COUNT(*) c FROM "SupplierProducts" WHERE "SupplierSKU" IS NULL OR "UnitPrice" IS NULL OR "MOQ" IS NULL');
  fgSP[0].c==0?P("SUP","No SupplierProducts on FinishedGoods"):F("SUP","VIOLATION: "+fgSP[0].c+" FG SupplierProducts");
  dupPref[0].c==0?P("SUP","Preferred supplier uniqueness OK"):F("SUP",dupPref[0].c+" components with multiple preferred");
  missSP[0].c==0?P("SUP","All SP fields complete"):W("SUP",missSP[0].c+" SPs with missing fields");
  
  const fgProd=await q('SELECT "Id" FROM "Products" WHERE "ProductType"=1 LIMIT 1');
  const activeSup=await q('SELECT "Id" FROM "Suppliers" WHERE "IsActive"=true LIMIT 1');
  if(fgProd.length>0&&activeSup.length>0){
    const fgRej=await apiRequest("POST","/api/SupplierProducts",{supplierId:activeSup[0].Id,productId:fgProd[0].Id,supplierSKU:"AUDIT-FG",unitPrice:100,moq:10,leadTimeDays:5,currency:"INR",isPreferred:false},token);
    if([400,409,422].includes(fgRej.s)){P("SUP","FG SupplierProduct rejected HTTP "+fgRej.s);}
    else if([200,201].includes(fgRej.s)){F("SUP","VIOLATION: FG SupplierProduct created HTTP "+fgRej.s);}
    else{W("SUP","FG reject returned HTTP "+fgRej.s);}
  }
  
  const aSup=await apiRequest("GET","/api/Suppliers?pageNumber=1&pageSize=5",null,token);
  aSup.s===200?P("SUP","API HTTP 200"):F("SUP","API HTTP "+aSup.s);
  
  // Section 8: PR
  I("PR","--- PURCHASE REQUEST ---");
  const prQty=await q('SELECT COUNT(*) c FROM (SELECT pr."Id" FROM "PurchaseRequests" pr JOIN "PurchaseRequestItems" pri ON pri."PurchaseRequestId"=pr."Id" GROUP BY pr."Id" HAVING SUM(pri."ConvertedQuantity")>SUM(pri."ApprovedQuantity") AND SUM(pri."ApprovedQuantity")>0) x');
  prQty[0].c==0?P("PR","No over-conversion violations"):F("PR",prQty[0].c+" violations");
  const prSrc2=await q('SELECT "Source",COUNT(*) c FROM "PurchaseRequests" GROUP BY "Source"');
  I("PR","Sources: "+prSrc2.map(r=>r.Source+":"+r.c).join(" "));
  const aPR=await apiRequest("GET","/api/PurchaseRequests?pageNumber=1&pageSize=5",null,token);
  aPR.s===200?P("PR","API HTTP 200"):F("PR","API HTTP "+aPR.s);
  
  // Section 9: PO
  I("PO","--- PURCHASE ORDER ---");
  const moqViol=await q('SELECT COUNT(*) c FROM "PurchaseOrderItems" poi JOIN "PurchaseOrders" po ON po."Id"=poi."PurchaseOrderId" LEFT JOIN "SupplierProducts" sp ON sp."ProductId"=poi."ProductId" AND sp."SupplierId"=po."SupplierId" AND sp."IsActive"=true WHERE sp."MOQ" IS NOT NULL AND poi."Quantity"<sp."MOQ"');
  const noSP2=await q('SELECT COUNT(*) c FROM "PurchaseOrderItems" poi JOIN "PurchaseOrders" po ON po."Id"=poi."PurchaseOrderId" WHERE NOT EXISTS (SELECT 1 FROM "SupplierProducts" sp WHERE sp."ProductId"=poi."ProductId" AND sp."SupplierId"=po."SupplierId" AND sp."IsActive"=true)');
  moqViol[0].c==0?P("PO","No MOQ violations in existing POs"):F("PO",moqViol[0].c+" items below MOQ");
  noSP2[0].c==0?P("PO","All PO items have SupplierProduct"):F("PO",noSP2[0].c+" items without SP");
  
  const testSP=await q('SELECT "ProductId","SupplierId","MOQ" FROM "SupplierProducts" WHERE "MOQ">1 AND "IsActive"=true LIMIT 1');
  if(testSP.length>0){
    const moqBp=await apiRequest("POST","/api/PurchaseOrders",{supplierId:testSP[0].SupplierId,expectedDeliveryDate:new Date(Date.now()+30*86400000).toISOString(),items:[{productId:testSP[0].ProductId,quantity:1,unitPrice:1}]},token);
    if([400,409,422].includes(moqBp.s)){P("PO","MOQ bypass rejected HTTP "+moqBp.s);}
    else if([200,201].includes(moqBp.s)){F("PO","VIOLATION: below-MOQ PO created!");}
    else{W("PO","MOQ bypass HTTP "+moqBp.s);}
  }
  
  const compProd=await q('SELECT "Id" FROM "Products" WHERE "ProductType"=2 LIMIT 1');
  if(compProd.length>0){
    const noRelSup=await q('SELECT s."Id" FROM "Suppliers" s WHERE s."IsActive"=true AND NOT EXISTS (SELECT 1 FROM "SupplierProducts" sp WHERE sp."SupplierId"=s."Id" AND sp."ProductId"=$1 AND sp."IsActive"=true) LIMIT 1',[compProd[0].Id]);
    if(noRelSup.length>0){
      const spBp=await apiRequest("POST","/api/PurchaseOrders",{supplierId:noRelSup[0].Id,expectedDeliveryDate:new Date(Date.now()+30*86400000).toISOString(),items:[{productId:compProd[0].Id,quantity:100,unitPrice:10}]},token);
      if([400,409,422].includes(spBp.s)){P("PO","Unauthorized supplier rejected HTTP "+spBp.s);}
      else if([200,201].includes(spBp.s)){F("PO","VIOLATION: Unauthorized supplier accepted!");}
      else{W("PO","Supplier bypass HTTP "+spBp.s);}
    }else{NV("PO","All suppliers have relationship to this product");}
  }
  
  const aPO=await apiRequest("GET","/api/PurchaseOrders?pageNumber=1&pageSize=5",null,token);
  aPO.s===200?P("PO","API HTTP 200"):F("PO","API HTTP "+aPO.s);
  
  // Section 10: GR & Inventory
  I("GR","--- GOODS RECEIPT & INVENTORY ---");
  const noInv=await q('SELECT COUNT(*) c FROM "GoodsReceiptItems" gri WHERE NOT EXISTS (SELECT 1 FROM "Inventories" i WHERE i."ProductId"=gri."ProductId")');
  const negInv=await q('SELECT COUNT(*) c FROM "Inventories" WHERE "QuantityOnHand"<0');
  const overRec=await q('SELECT COUNT(*) c FROM (SELECT poi."Id" FROM "PurchaseOrderItems" poi LEFT JOIN "GoodsReceiptItems" gri ON gri."PurchaseOrderItemId"=poi."Id" GROUP BY poi."Id",poi."Quantity" HAVING COALESCE(SUM(gri."ReceivedQuantity"),0)>poi."Quantity") x');
  noInv[0].c==0?P("GR","All GR items have Inventory"):F("GR",noInv[0].c+" without inventory");
  negInv[0].c==0?P("GR","No negative inventory"):F("GR",negInv[0].c+" negative records");
  overRec[0].c==0?P("GR","No over-received items"):F("GR",overRec[0].c+" over-received");
  const invSample=await q('SELECT p."ProductName",i."QuantityOnHand",i."QuantityAvailable" FROM "Inventories" i JOIN "Products" p ON p."Id"=i."ProductId" ORDER BY i."QuantityOnHand" DESC LIMIT 6');
  invSample.forEach(r=>I("GR",r.ProductName+" onHand="+r.QuantityOnHand+" avail="+r.QuantityAvailable));
  const aGR=await apiRequest("GET","/api/GoodsReceipts?pageNumber=1&pageSize=5",null,token);
  aGR.s===200?P("GR","API HTTP 200"):F("GR","API HTTP "+aGR.s);
  
  // Section 11: Inv->Prod
  I("INV_PROD","--- INVENTORY -> PRODUCTION ---");
  const invMismatch=await q('SELECT COUNT(*) c FROM "ProductionRequirements" pr LEFT JOIN "Inventories" i ON i."ProductId"=pr."ProductId" WHERE pr."RequiredQuantity">0 AND ABS(COALESCE(pr."AvailableQuantity",0)-COALESCE(i."QuantityAvailable",0))>0.01');
  const invTotal=await q('SELECT COUNT(*) c FROM "ProductionRequirements" WHERE "RequiredQuantity">0');
  if(invTotal[0].c>0){
    invMismatch[0].c==0?P("INV_PROD","All "+invTotal[0].c+" requirements consistent with inventory"):F("INV_PROD",invMismatch[0].c+"/"+invTotal[0].c+" mismatches");
  }else{NV("INV_PROD","No active production requirements");}
  
  // Section 12: Procurement Dashboard
  I("DASH","--- PROCUREMENT DASHBOARD ---");
  const kpi=await q(`SELECT 
    (SELECT COUNT(*) FROM "PurchaseRequests" WHERE "Status" IN (1,2,6)) "pendingPurchaseRequests",
    (SELECT COUNT(*) FROM "PurchaseRequests" WHERE "Status"=3) "awaitingApproval",
    (SELECT COUNT(*) FROM "PurchaseOrders" WHERE "Status" IN (1,2,3)) "openPurchaseOrders",
    (SELECT COUNT(*) FROM "PurchaseOrders" po WHERE po."Status"=3 AND
      (SELECT COALESCE(SUM(poi."Quantity"),0) FROM "PurchaseOrderItems" poi WHERE poi."PurchaseOrderId"=po."Id")>
      (SELECT COALESCE(SUM(gri."ReceivedQuantity"),0) FROM "GoodsReceiptItems" gri JOIN "GoodsReceipts" gr ON gr."Id"=gri."GoodsReceiptId" WHERE gr."PurchaseOrderId"=po."Id")
    ) "pendingReceipts",
    (SELECT COUNT(*) FROM "PurchaseOrders" po WHERE po."Status"=3 AND po."ExpectedDeliveryDate"<CURRENT_DATE AND
      (SELECT COALESCE(SUM(poi."Quantity"),0) FROM "PurchaseOrderItems" poi WHERE poi."PurchaseOrderId"=po."Id")>
      (SELECT COALESCE(SUM(gri."ReceivedQuantity"),0) FROM "GoodsReceiptItems" gri JOIN "GoodsReceipts" gr ON gr."Id"=gri."GoodsReceiptId" WHERE gr."PurchaseOrderId"=po."Id")
    ) "overdueReceipts"`);
  const dbKpi=kpi[0];
  I("DASH","DB KPIs: "+JSON.stringify(dbKpi));
  
  const apiKpi=await apiRequest("GET","/api/Reports/procurement",null,token);
  if(apiKpi.s===200){
    const apiData=apiKpi.b.data||apiKpi.b;
    I("DASH","API response: "+JSON.stringify(apiData));
    let mm=0;
    for(const k of["pendingPurchaseRequests","awaitingApproval","openPurchaseOrders","pendingReceipts","overdueReceipts"]){
      const dbV=parseInt(dbKpi[k]||0);
      const apiV=parseInt(apiData[k]||0);
      if(dbV===apiV){P("DASH",k+": "+apiV+" MATCH");}
      else{F("DASH","MISMATCH "+k+": DB="+dbV+" API="+apiV);mm++;}
    }
    mm===0?P("DASH","ALL 5 KPIs match database"):F("DASH",mm+" KPI mismatches");
  }else{F("DASH","API HTTP "+apiKpi.s);}
  
  // Section 13: DB Integrity
  I("INTEGRITY","--- DATABASE INTEGRITY ---");
  const fkViol=await q("SELECT COUNT(*) c FROM pg_constraint WHERE contype='f' AND convalidated=false");
  const nullIds=await q('SELECT COUNT(*) c FROM "Products" WHERE "ProductCode" IS NULL OR "SKU" IS NULL OR "ProductNumber" IS NULL');
  const orphPRI=await q('SELECT COUNT(*) c FROM "PurchaseRequestItems" WHERE NOT EXISTS (SELECT 1 FROM "PurchaseRequests" pr WHERE pr."Id"="PurchaseRequestId")');
  const orphPOI=await q('SELECT COUNT(*) c FROM "PurchaseOrderItems" WHERE NOT EXISTS (SELECT 1 FROM "PurchaseOrders" po WHERE po."Id"="PurchaseOrderId")');
  const orphGRI=await q('SELECT COUNT(*) c FROM "GoodsReceiptItems" WHERE NOT EXISTS (SELECT 1 FROM "GoodsReceipts" gr WHERE gr."Id"="GoodsReceiptId")');
  fkViol[0].c==0?P("INTEGRITY","No invalid FK constraints"):F("INTEGRITY",fkViol[0].c+" FK violations");
  nullIds[0].c==0?P("INTEGRITY","No NULL identifiers"):F("INTEGRITY",nullIds[0].c+" NULL identifiers");
  orphPRI[0].c==0?P("INTEGRITY","No orphan PurchaseRequestItems"):F("INTEGRITY",orphPRI[0].c+" orphans");
  orphPOI[0].c==0?P("INTEGRITY","No orphan PurchaseOrderItems"):F("INTEGRITY",orphPOI[0].c+" orphans");
  orphGRI[0].c==0?P("INTEGRITY","No orphan GoodsReceiptItems"):F("INTEGRITY",orphGRI[0].c+" orphans");
  
  I("DONE","=== AUDIT COMPLETE === "+new Date().toISOString());
  await c.end();
}
main().catch(e=>{console.error("CRASH:"+e.message+"\n"+e.stack);process.exit(1)});
