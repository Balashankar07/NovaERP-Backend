const {Client}=require("pg");
const c=new Client({host:"localhost",port:5432,database:"NovaERPDB",user:"postgres",password:"balan123"});
const http=require("http");
function api(method,path,body,token){
  return new Promise(resolve=>{
    const bodyStr=body?JSON.stringify(body):null;
    const headers={"Content-Type":"application/json"};
    if(token)headers["Authorization"]="Bearer "+token;
    if(bodyStr)headers["Content-Length"]=Buffer.byteLength(bodyStr);
    const opt={hostname:"localhost",port:5233,path:path,method,headers};
    const req=http.request(opt,r=>{let d="";r.on("data",x=>d+=x);r.on("end",()=>{try{resolve({s:r.statusCode,b:JSON.parse(d)})}catch{resolve({s:r.statusCode,b:d})}});});
    req.on("error",e=>resolve({s:0,err:e.message}));
    if(bodyStr)req.write(bodyStr);
    req.end();
  });
}
async function main(){
  await c.connect();
  const q=async(sql,p)=>(await c.query(sql,p)).rows;
  const login=await api("POST","/api/Auth/login",{email:"balashankar07@gmail.com",password:"Admin@123"});
  const token=login.b.data.accessToken;
  const r=await api("GET","/api/Reports/procurement",null,token);
  console.log("STATUS:"+r.s);
  console.log("RESPONSE:"+JSON.stringify(r.b,null,2));
  
  // Check dashboard fields in both DB and API
  console.log("\n=== DB KPIs (for comparison) ===");
  // PR status 0=Draft, 1=?, 2=?, 3=AwaitingApproval, 4=Approved, 5=PartiallyConverted, 6=FullyConverted
  // From data: 0,4,5,6 exist in DB
  const prStat=await q('SELECT "Status",COUNT(*) c FROM "PurchaseRequests" GROUP BY "Status" ORDER BY "Status"');
  prStat.forEach(r=>console.log("PR Status "+r.Status+": "+r.c));
  const poStat=await q('SELECT "Status",COUNT(*) c FROM "PurchaseOrders" GROUP BY "Status" ORDER BY "Status"');
  poStat.forEach(r=>console.log("PO Status "+r.Status+": "+r.c));
  await c.end();
}
main().catch(e=>{console.error("ERR:"+e.message);process.exit(1)});
