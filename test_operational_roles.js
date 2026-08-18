const { Client } = require('pg');
const http = require('http');
const assert = require('assert');

async function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 5233,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        if (bodyStr) {
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

async function runTests() {
    console.log('=== API Roles Verification ===\n');

    let loginRes = await makeRequest('POST', '/Auth/login', { email: 'balashankar07@gmail.com', password: 'Admin@123' });
    if (loginRes.status !== 200) {
        console.error('Error: Login failed');
        process.exit(1);
    }
    const token = loginRes.data.data.accessToken;
    console.log('✅ Authenticated successfully.');

    let rolesRes = await makeRequest('GET', '/Role?pageSize=100&isOperationallyReady=true', null, token);
    
    assert(rolesRes.status === 200, 'Roles fetched successfully');
    
    const returnedRoles = rolesRes.data.data.items.map(r => r.name);
    
    const expectedRoles = [
        'System Administrator',
        'Production Manager',
        'Procurement Manager',
        'Warehouse Manager'
    ];
    
    const notExpectedRoles = [
        'HR Manager',
        'Super Admin',
        'Inventory Manager',
        'Employee',
        'Sales Manager',
        'CEO',
        'Quality Engineer',
        'Finance Manager',
        'Warranty Executive',
        'Distributor'
    ];

    let success = true;
    for (const role of expectedRoles) {
        if (!returnedRoles.includes(role)) {
            console.error(`❌ Expected role NOT found: ${role}`);
            success = false;
        } else {
            console.log(`✅ Expected role found: ${role}`);
        }
    }

    for (const role of notExpectedRoles) {
        if (returnedRoles.includes(role)) {
            console.error(`❌ Hidden role FOUND: ${role}`);
            success = false;
        } else {
            console.log(`✅ Hidden role correctly not returned: ${role}`);
        }
    }

    if (!success) {
        console.error('\n❌ API Verification Failed!');
        process.exit(1);
    } else {
        console.log('\n✅ ALL API VERIFICATIONS PASSED.');
    }
}

runTests().catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
