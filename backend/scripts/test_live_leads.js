async function testLive() {
  const loginRes = await fetch('https://api-pxy3tatiuq-el.a.run.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'KEY', accessKey: 'SALES_KEY_2026' })
  });
  const loginData = await loginRes.json();
  console.log("Live Login:", loginData.message, "Role:", loginData.user?.role);

  const leadsRes = await fetch('https://api-pxy3tatiuq-el.a.run.app/api/leads', {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const leadsData = await leadsRes.json();
  console.log("Live Leads API response count:", Array.isArray(leadsData) ? leadsData.length : leadsData);
}

testLive().catch(console.error);
