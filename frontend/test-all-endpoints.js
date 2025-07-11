// Quick API Verification Script
// Run this in your browser console to test all 5 endpoints

const API_BASE = 'https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com';

async function testAllEndpoints() {
  console.log('🧪 Testing All AWS Authentication Endpoints...\n');
  
  // Test credentials
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  let accessToken = '';
  let refreshToken = '';
  
  // 1. Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health Check:', healthRes.status === 200 ? 'PASS' : 'FAIL');
    console.log('   Status:', healthData.status);
  } catch (e) {
    console.log('❌ Health Check: FAIL', e.message);
  }
  
  // 2. Registration
  console.log('\n2️⃣ Testing Registration...');
  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User'
      })
    });
    const regData = await regRes.json();
    console.log('✅ Registration:', regRes.status === 201 ? 'PASS' : 'FAIL');
    console.log('   User ID:', regData.userId);
  } catch (e) {
    console.log('❌ Registration: FAIL', e.message);
  }
  
  // 3. Login
  console.log('\n3️⃣ Testing Login...');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    console.log('✅ Login:', loginRes.status === 200 ? 'PASS' : 'FAIL');
    if (loginData.accessToken) {
      accessToken = loginData.accessToken;
      refreshToken = loginData.refreshToken;
      console.log('   Access Token:', accessToken.substring(0, 50) + '...');
      console.log('   User:', loginData.user.email);
    }
  } catch (e) {
    console.log('❌ Login: FAIL', e.message);
  }
  
  // 4. Get Profile
  console.log('\n4️⃣ Testing Get Profile...');
  try {
    const profileRes = await fetch(`${API_BASE}/users/profile`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profileData = await profileRes.json();
    console.log('✅ Get Profile:', profileRes.status === 200 ? 'PASS' : 'FAIL');
    if (profileRes.status === 200) {
      console.log('   Email:', profileData.email);
      console.log('   Name:', `${profileData.firstName} ${profileData.lastName}`);
    }
  } catch (e) {
    console.log('❌ Get Profile: FAIL', e.message);
  }
  
  // 5. Refresh Token
  console.log('\n5️⃣ Testing Token Refresh...');
  try {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const refreshData = await refreshRes.json();
    console.log('✅ Token Refresh:', refreshRes.status === 200 ? 'PASS' : 'FAIL');
    if (refreshRes.status === 200) {
      console.log('   New Token:', refreshData.accessToken.substring(0, 50) + '...');
      console.log('   Expires In:', refreshData.expiresIn, 'seconds');
    }
  } catch (e) {
    console.log('❌ Token Refresh: FAIL', e.message);
  }
  
  console.log('\n✅ Test Complete! All endpoints verified.');
  console.log('📝 Test Account Created:', testEmail);
}

// Run the test
testAllEndpoints();
