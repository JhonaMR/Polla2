const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Admin123!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in seed-data.sql');
}

generateHash().catch(console.error);
