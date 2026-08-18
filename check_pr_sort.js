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
  const login=await api("POST","/api/Auth/login",{email:"balashankar07@gmail.com",password:"Admin@123"});
  const token=login.b.data.accessToken;

  const prResponse = await api("GET","/api/purchase-requests?pageNumber=1&pageSize=10&sortBy=RequestDate&sortOrder=desc",null,token);
  console.log(prResponse.s);
  console.log(JSON.stringify(prResponse.b, null, 2));

  await c.end();
}
main().catch(console.error);
