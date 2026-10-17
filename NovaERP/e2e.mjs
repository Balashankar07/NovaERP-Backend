const API_BASE = 'http://localhost:5232/api';
let token = '';

async function login(email, password) {
  const res = await fetch(`${API_BASE}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const data = await res.json();
  return data.data.token;
}

async function apiCall(endpoint, method = 'GET', body = null, authToken = token) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (res.status === 401) return { status: 401, error: 'Unauthorized' };
  if (res.status === 403) return { status: 403, error: 'Forbidden' };
  
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  
  return { status: res.status, data };
}

async function runTests() {
  const results = [];
  
  try {
    // 1. Get Token
    token = await login('admin@novaerp.com', 'Admin@123');
    
    // --- ROLES E2E ---
    let roleRes = await apiCall('/Role?pageNumber=1&pageSize=10');
    results.push({ test: 'Roles list', expected: 'Loads', actual: roleRes.status === 200 ? 'Loaded' : 'Failed', status: roleRes.status === 200 ? 'PASS' : 'FAIL' });
    
    let createRoleRes = await apiCall('/Role', 'POST', { name: 'E2E_TestRole_A', description: 'Test Role A' });
    let roleA = createRoleRes?.data?.data || { id: 'dummy-role-a' };
    results.push({ test: 'Create role', expected: 'Success', actual: createRoleRes.status === 200 ? '200 OK' : createRoleRes.status, status: createRoleRes.status === 200 ? 'PASS' : 'FAIL' });
    
    let editRoleRes = await apiCall(`/Role/${roleA.id}`, 'PUT', { name: 'E2E_TestRole_A_Edited', description: 'Edited', isActive: true });
    results.push({ test: 'Edit role', expected: 'Success', actual: editRoleRes.status === 200 ? '200 OK' : editRoleRes.status, status: editRoleRes.status === 200 ? 'PASS' : 'FAIL' });
    
    let createRoleBRes = await apiCall('/Role', 'POST', { name: 'E2E_TestRole_B', description: 'Test Role B' });
    let roleB = createRoleBRes?.data?.data || { id: 'dummy-role-b' };

    // --- PERMISSIONS E2E ---
    let assignResA = await apiCall(`/Permissions/role/${roleA.id}`, 'PUT', ['Permissions.Products.View']);
    let assignResB = await apiCall(`/Permissions/role/${roleB.id}`, 'PUT', ['Permissions.Brands.View']);
    results.push({ test: 'Assign permissions', expected: 'Success', actual: assignResA.status === 200 ? '200 OK' : assignResA.status, status: assignResA.status === 200 ? 'PASS' : 'FAIL' });

    let removePermRes = await apiCall(`/Permissions/role/${roleA.id}`, 'PUT', []);
    results.push({ test: 'Remove permissions', expected: 'Success', actual: removePermRes.status === 200 ? '200 OK' : removePermRes.status, status: removePermRes.status === 200 ? 'PASS' : 'FAIL' });

    // Re-assign for further tests
    await apiCall(`/Permissions/role/${roleA.id}`, 'PUT', ['Permissions.Products.View']);

    // --- USERS E2E ---
    let usersRes = await apiCall('/User?pageNumber=1&pageSize=10');
    results.push({ test: 'Users list', expected: 'Loads', actual: usersRes.status === 200 ? 'Loaded' : 'Failed', status: usersRes.status === 200 ? 'PASS' : 'FAIL' });
    
    let createUserRes = await apiCall('/User', 'POST', {
      firstName: 'Test', lastName: 'User', email: 'test.e2e@novaerp.com', phone: '', password: 'Password123!', roleIds: [roleA.id, roleB.id]
    });
    let testUser = createUserRes?.data?.data || { id: 'dummy-user', roleIds: [] };
    results.push({ test: 'Create user', expected: 'Success', actual: createUserRes.status === 200 ? '200 OK' : createUserRes.status, status: createUserRes.status === 200 ? 'PASS' : 'FAIL' });
    
    let assignedMultipleRoles = testUser.roleIds && testUser.roleIds.length === 2;
    results.push({ test: 'Assign multiple roles', expected: 'Success', actual: assignedMultipleRoles ? 'Assigned' : 'Failed', status: assignedMultipleRoles ? 'PASS' : 'FAIL' });

    let editUserRes = await apiCall(`/User/${testUser.id}`, 'PUT', {
       firstName: 'Test', lastName: 'User Edited', phone: '', roleIds: [roleA.id, roleB.id], isActive: false
    });
    results.push({ test: 'Edit user', expected: 'Success', actual: editUserRes.status === 200 ? '200 OK' : editUserRes.status, status: editUserRes.status === 200 ? 'PASS' : 'FAIL' });

    results.push({ test: 'Deactivate user', expected: 'Success', actual: editUserRes.status === 200 ? '200 OK' : 'Failed', status: editUserRes.status === 200 ? 'PASS' : 'FAIL' });
    
    let reactivateRes = await apiCall(`/User/${testUser.id}`, 'PUT', {
       firstName: 'Test', lastName: 'User Edited', phone: '', roleIds: [roleA.id, roleB.id], isActive: true
    });
    results.push({ test: 'Activate user', expected: 'Success', actual: reactivateRes.status === 200 ? '200 OK' : 'Failed', status: reactivateRes.status === 200 ? 'PASS' : 'FAIL' });

    // --- TRUE MULTI-ROLE AUTHORIZATION TEST ---
    let testToken = await login('test.e2e@novaerp.com', 'Password123!');
    
    let permA_Endpoint = await apiCall('/Products?pageNumber=1&pageSize=10', 'GET', null, testToken);
    results.push({ test: 'Multi-role Permission A (Products View)', expected: '200', actual: permA_Endpoint.status, status: permA_Endpoint.status === 200 ? 'PASS' : 'FAIL' });

    let permB_Endpoint = await apiCall('/Brands?pageNumber=1&pageSize=10', 'GET', null, testToken);
    results.push({ test: 'Multi-role Permission B (Brands View)', expected: '200', actual: permB_Endpoint.status, status: permB_Endpoint.status === 200 ? 'PASS' : 'FAIL' });

    let permC_Endpoint = await apiCall('/Categories?pageNumber=1&pageSize=10', 'GET', null, testToken);
    results.push({ test: 'Unassigned permission (Categories View)', expected: '403', actual: permC_Endpoint.status, status: permC_Endpoint.status === 403 ? 'PASS' : 'FAIL' });

    // --- ROLE REMOVAL TEST ---
    await apiCall(`/User/${testUser.id}`, 'PUT', {
       firstName: 'Test', lastName: 'User Edited', phone: '', roleIds: [roleA.id], isActive: true
    }); // removed roleB
    
    // Test user needs a new token? No, NovaERP authorizes on the fly if it queries the DB
    let permB_Endpoint_AfterRemove = await apiCall('/Brands?pageNumber=1&pageSize=10', 'GET', null, testToken);
    results.push({ test: 'Remove Role B', expected: 'Permission B → 403', actual: permB_Endpoint_AfterRemove.status, status: permB_Endpoint_AfterRemove.status === 403 ? 'PASS' : 'FAIL' });

    // --- UNAUTHENTICATED TEST ---
    let unauthReq = await apiCall('/Role?pageNumber=1&pageSize=10', 'GET', null, '');
    results.push({ test: 'Unauthenticated API', expected: '401', actual: unauthReq.status, status: unauthReq.status === 401 ? 'PASS' : 'FAIL' });

    // --- UNAUTHORIZED TEST ---
    let unauthAdminReq = await apiCall('/Role?pageNumber=1&pageSize=10', 'GET', null, testToken);
    results.push({ test: 'Unauthorized API (Test User fetching Roles)', expected: '403', actual: unauthAdminReq.status, status: unauthAdminReq.status === 403 ? 'PASS' : 'FAIL' });

    console.log(JSON.stringify(results, null, 2));
  } catch(e) {
    console.log("CRASH BEFORE COMPLETION. Current Results:");
    console.log(JSON.stringify(results, null, 2));
    console.error(e);
  }
}
runTests();
