const http = require('http');

const API_URL = 'http://localhost:5233/api';

async function makeRequest(method, endpoint, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                let parsed = null;
                if (responseBody) {
                    try { parsed = JSON.parse(responseBody); } catch (e) { parsed = responseBody; }
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function run() {
    const loginRes = await makeRequest('POST', '/Auth/login', {
        email: 'balashankar07@gmail.com',
        password: 'Admin@123'
    });
    
    const token = loginRes.data.data.accessToken;
    
    console.log("Fetching with default parameters from PR page...");
    const prRes = await makeRequest('GET', '/purchase-requests?sortBy=RequestDate&sortOrder=desc&pageNumber=1&pageSize=10', null, token);
    console.log(`Status: ${prRes.status}`);
    if (prRes.status !== 200) {
        console.log("ERROR DATA:", prRes.data);
    }
}

run();
