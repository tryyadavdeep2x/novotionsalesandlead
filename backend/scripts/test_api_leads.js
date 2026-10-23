async function testApi() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'KEY', accessKey: 'SALES_KEY_2026' })
  });
  const loginData = await loginRes.json();
  console.log("Login result:", loginData.message, "Role:", loginData.user?.role);

  const leadsRes = await fetch('http://localhost:5000/api/leads', {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const leadsData = await leadsRes.json();
  console.log("Leads API response count:", Array.isArray(leadsData) ? leadsData.length : leadsData);
}

testApi().catch(console.error);
