async function checkApi() {
  try {
    // We need a token to fetch, let's first login as admin or see if there is any user
    // Since SOP user exists with password '2114' or 'Admin123!', let's try logging in
    const loginRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SOP', password: '2114' })
    });
    
    let loginData = await loginRes.json() as any;
    if (!loginRes.ok) {
      // Try with 'Admin123!'
      const loginRes2 = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'SOP', password: 'Admin123!' })
      });
      loginData = await loginRes2.json();
    }
    
    const token = loginData.data?.accessToken;
    if (!token) {
      console.error('Failed to login:', loginData);
      return;
    }
    
    const teamsRes = await fetch('http://localhost:3002/api/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const teamsData = await teamsRes.json() as any;
    const teams = teamsData.data || [];
    const groups = Array.from(new Set(teams.map((t: any) => t.groupLetter))).sort();
    
    console.log('--- API /api/teams RESPONSE ---');
    console.log('Total Teams returned:', teams.length);
    console.log('Groups returned:', groups.join(', '));
  } catch (err) {
    console.error('Error fetching API:', err);
  }
}

checkApi();
