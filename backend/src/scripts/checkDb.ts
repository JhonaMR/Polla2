import { prisma } from '../config/database.js';

async function check() {
  try {
    const teams = await prisma.team.findMany();
    const matches = await prisma.match.findMany();
    const groups = Array.from(new Set(teams.map(t => t.groupLetter))).sort();
    
    console.log('--- DATABASE STATUS ---');
    console.log('Total Teams:', teams.length);
    console.log('Total Matches:', matches.length);
    console.log('Groups in DB:', groups.join(', '));
    console.log('Teams per Group:');
    groups.forEach(g => {
      const gTeams = teams.filter(t => t.groupLetter === g).map(t => t.name);
      console.log(`  Group ${g} (${gTeams.length} teams):`, gTeams.join(', '));
    });
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
