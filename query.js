const axios = require('axios');

async function test() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:5233/api/Auth/login', {
      email: 'production@novaerp.com',
      password: 'DevPassword_Production_Secured!'
    });
    const token = loginRes.data.data.accessToken;
    console.log("Logged in. Token:", token.substring(0, 20) + "...");

    // 2. Fetch Production Summary
    const summaryRes = await axios.get('http://localhost:5233/api/Reports/production/summary', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Summary success:", summaryRes.data);
  } catch (error) {
    console.error("Error occurred:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

test();
