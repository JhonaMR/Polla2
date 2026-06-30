import { prisma } from '../config/database.js';

async function main() {
  try {
    const match = await prisma.match.findUnique({
      where: { id: 74 },
      include: {
        teamA: true,
        teamB: true,
        predictions: {
          include: {
            user: true
          }
        }
      }
    });

    if (match) {
      console.log(`\nMatch #${match.matchNumber} (${match.phase})`);
      console.log(`Actual Score: ${match.scoreA} - ${match.scoreB} (Pen: ${match.penaltiesScoreA} - ${match.penaltiesScoreB})`);
      console.log(`Winner ID: ${match.winnerTeamId}`);
      console.log(`Predictions:`);
      for (const pred of match.predictions) {
        console.log(`  - User: ${pred.user.username}`);
        console.log(`    Predicted: ${pred.predictedScoreA} - ${pred.predictedScoreB}`);
        console.log(`    Points Earned: ${pred.pointsEarned}, isCorrect: ${pred.isCorrect}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
