const axios = require('axios');

async function testProductsApi() {
  try {
    const res = await axios.get('http://localhost:5233/api/Products?pageSize=100');
    console.log("Total returned:", res.data.data.items.length);
    console.log("Sample product item:", res.data.data.items[0]);
    console.log("Product types in returned list:", [...new Set(res.data.data.items.map(p => p.productType || p.type))]);
  } catch (err) {
    console.error(err.message);
  }
}

testProductsApi();
