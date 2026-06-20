import { prisma } from '../config/database.js';

function parseDateColombiaToUTC(dateStr: string): Date {
  const parts = dateStr.trim().split(/\s+/);
  const dateParts = parts[0].split('/');
  const timeParts = parts[1].split(':');
  const ampm = parts[2].toUpperCase();

  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // 0-indexed
  const year = parseInt(dateParts[2]);

  let hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);

  if (ampm === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }

  // Colombia is UTC-5, so we add 5 hours to convert to UTC
  return new Date(Date.UTC(year, month, day, hour + 5, minute, 0));
}

const matchData = [
  // ROUND_OF_32
  { matchNumber: 73, phase: 'ROUND_OF_32', date: '28/06/2026 02:00 PM' },
  { matchNumber: 74, phase: 'ROUND_OF_32', date: '29/06/2026 03:30 PM' },
  { matchNumber: 75, phase: 'ROUND_OF_32', date: '29/06/2026 12:00 PM' },
  { matchNumber: 76, phase: 'ROUND_OF_32', date: '29/06/2026 10:00 PM' },
  { matchNumber: 77, phase: 'ROUND_OF_32', date: '30/06/2026 04:00 PM' },
  { matchNumber: 78, phase: 'ROUND_OF_32', date: '30/06/2026 12:00 PM' },
  { matchNumber: 79, phase: 'ROUND_OF_32', date: '30/06/2026 10:00 PM' },
  { matchNumber: 80, phase: 'ROUND_OF_32', date: '01/07/2026 11:00 AM' },
  { matchNumber: 81, phase: 'ROUND_OF_32', date: '01/07/2026 03:00 PM' },
  { matchNumber: 82, phase: 'ROUND_OF_32', date: '01/07/2026 07:00 PM' },
  { matchNumber: 83, phase: 'ROUND_OF_32', date: '02/07/2026 06:00 PM' },
  { matchNumber: 84, phase: 'ROUND_OF_32', date: '02/07/2026 02:00 PM' },
  { matchNumber: 85, phase: 'ROUND_OF_32', date: '02/07/2026 10:00 PM' },
  { matchNumber: 86, phase: 'ROUND_OF_32', date: '03/07/2026 01:00 PM' },
  { matchNumber: 87, phase: 'ROUND_OF_32', date: '03/07/2026 05:00 PM' },
  { matchNumber: 88, phase: 'ROUND_OF_32', date: '03/07/2026 08:30 PM' },

  // ROUND_OF_16
  { matchNumber: 89, phase: 'ROUND_OF_16', date: '04/07/2026 12:00 PM' },
  { matchNumber: 90, phase: 'ROUND_OF_16', date: '04/07/2026 04:00 PM' },
  { matchNumber: 91, phase: 'ROUND_OF_16', date: '05/07/2026 03:00 PM' },
  { matchNumber: 92, phase: 'ROUND_OF_16', date: '05/07/2026 09:00 PM' },
  { matchNumber: 93, phase: 'ROUND_OF_16', date: '06/07/2026 02:00 PM' },
  { matchNumber: 94, phase: 'ROUND_OF_16', date: '06/07/2026 07:00 PM' },
  { matchNumber: 95, phase: 'ROUND_OF_16', date: '07/07/2026 11:00 AM' },
  { matchNumber: 96, phase: 'ROUND_OF_16', date: '07/07/2026 03:00 PM' },

  // QUARTERFINALS
  { matchNumber: 97, phase: 'QUARTERFINALS', date: '09/07/2026 03:00 PM' },
  { matchNumber: 98, phase: 'QUARTERFINALS', date: '10/07/2026 02:00 PM' },
  { matchNumber: 99, phase: 'QUARTERFINALS', date: '11/07/2026 04:00 PM' },
  { matchNumber: 100, phase: 'QUARTERFINALS', date: '11/07/2026 10:00 PM' },

  // SEMIFINALS
  { matchNumber: 101, phase: 'SEMIFINALS', date: '14/07/2026 02:00 PM' },
  { matchNumber: 102, phase: 'SEMIFINALS', date: '15/07/2026 02:00 PM' },

  // THIRD_PLACE
  { matchNumber: 103, phase: 'THIRD_PLACE', date: '18/07/2026 04:00 PM' },

  // FINAL
  { matchNumber: 104, phase: 'FINAL', date: '19/07/2026 02:00 PM' },
];

async function insertMatches() {
  try {
    console.log('🌱 Starting to seed bracket matches (73 to 104)...');

    for (const data of matchData) {
      const matchDate = parseDateColombiaToUTC(data.date);
      const externalId = `match-${data.matchNumber}`;

      await prisma.match.upsert({
        where: { externalId },
        update: {
          phase: data.phase as any,
          matchDate,
          matchNumber: data.matchNumber,
        },
        create: {
          externalId,
          phase: data.phase as any,
          matchDate,
          matchNumber: data.matchNumber,
          status: 'PENDING',
        },
      });
      console.log(`✓ Match ${data.matchNumber} (${data.phase}) upserted. Date: ${matchDate.toISOString()}`);
    }

    console.log('✅ Seeding of bracket matches completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding matches:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertMatches();
