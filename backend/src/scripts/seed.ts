import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await hashPassword('2114');
    const admin = await prisma.user.upsert({
      where: { username: 'SOP' },
      update: { passwordHash: adminPassword },
      create: {
        uid: uuidv4(),
        username: 'SOP',
        displayName: 'SOPORTE',
        passwordHash: adminPassword,
        role: 'ADMIN',
        points: 0,
      },
    });

    console.log('✓ Admin user created:', admin.username);

    // Create sample teams
    const teams = [
      { externalId: 'team-1', name: 'Argentina', region: 'South America', groupLetter: 'A' },
      { externalId: 'team-2', name: 'France', region: 'Europe', groupLetter: 'A' },
      { externalId: 'team-3', name: 'Germany', region: 'Europe', groupLetter: 'B' },
      { externalId: 'team-4', name: 'Brazil', region: 'South America', groupLetter: 'B' },
      { externalId: 'team-5', name: 'Spain', region: 'Europe', groupLetter: 'C' },
      { externalId: 'team-6', name: 'England', region: 'Europe', groupLetter: 'C' },
      { externalId: 'team-7', name: 'Netherlands', region: 'Europe', groupLetter: 'D' },
      { externalId: 'team-8', name: 'Belgium', region: 'Europe', groupLetter: 'D' },
    ];

    for (const team of teams) {
      await prisma.team.upsert({
        where: { externalId: team.externalId },
        update: {},
        create: team,
      });
    }

    console.log('✓ Sample teams created');

    // Create sample matches
    const teamA = await prisma.team.findFirst({ where: { externalId: 'team-1' } });
    const teamB = await prisma.team.findFirst({ where: { externalId: 'team-2' } });

    if (teamA && teamB) {
      await prisma.match.upsert({
        where: { externalId: 'match-1' },
        update: {},
        create: {
          externalId: 'match-1',
          phase: 'GROUPS',
          teamAId: teamA.id,
          teamBId: teamB.id,
          matchDate: new Date('2026-06-15T20:00:00Z'),
          matchNumber: 1,
          status: 'PENDING',
        },
      });
    }

    console.log('✓ Sample matches created');

    // Create sample bonus questions
    const bonusQuestions = [
      {
        question: '¿Cuál será el máximo goleador del torneo?',
        correctAnswer: 'Mbappé',
        category: 'Top Scorer',
      },
      {
        question: '¿Cuál será el equipo con más goles?',
        correctAnswer: 'Argentina',
        category: 'Team Stats',
      },
      {
        question: '¿Cuántos goles habrá en la final?',
        correctAnswer: '3',
        category: 'Final Stats',
      },
    ];

    for (const question of bonusQuestions) {
      await prisma.bonusQuestion.upsert({
        where: { id: bonusQuestions.indexOf(question) + 1 }, // upserting for stability
        update: {},
        create: question,
      });
    }

    console.log('✓ Sample bonus questions created');

    // Create PhaseConfigurations
    const phases = [
      { phase: 'GROUPS', status: 'OPEN_FOR_PREDICTIONS' },
      { phase: 'ROUND_OF_32', status: 'LOCKED' },
      { phase: 'ROUND_OF_16', status: 'LOCKED' },
      { phase: 'QUARTERFINALS', status: 'LOCKED' },
      { phase: 'SEMIFINALS', status: 'LOCKED' },
      { phase: 'THIRD_PLACE', status: 'LOCKED' },
      { phase: 'FINAL', status: 'LOCKED' },
    ];

    for (const p of phases) {
      await prisma.phaseConfiguration.upsert({
        where: { phase: p.phase as any },
        update: {},
        create: p as any,
      });
    }

    console.log('✓ Phase configurations seeded');

    // Seed default Puntos config
    const configPuntos = await prisma.puntos.findFirst();
    if (!configPuntos) {
      await prisma.puntos.create({
        data: {
          acierto: 5,
          aciertoCompleto: 7,
          pregunta: 20
        }
      });
      console.log('✓ Puntos configuration initialized (5, 7, 20)');
    }

    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
