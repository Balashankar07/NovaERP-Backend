const axios = require('axios');

async function testProductsApi() {
  try {
    const loginRes = await axios.post('http://localhost:5233/api/Auth/login', {
      email: 'balashankar07@gmail.com',
      password: 'password123' // or whatever password
    });
    const token = loginRes.data.data.token;
    const res = await axios.get('http://localhost:5233/api/Products?pageSize=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Total returned products:", res.data.data.items.length);
    console.log("Sample product item:", res.data.data.items[0]);
    console.log("Sample product keys:", Object.keys(res.data.data.items[0]));
    console.log("Product names in dropdown:", res.data.data.items.map(p => ({ name: p.name, sku: p.productCode || p.sku, type: p.productType, typeStr: p.type })));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

testProductsApi();
