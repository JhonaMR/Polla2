import { prisma } from '../config/database.js';
import { classificationService } from './classificationService.js';

export class BracketService {
  // Initialize the matches 49 to 80 in the DB if they don't exist and link them
  async initializeBracketMatches(): Promise<void> {
    const phases = [
      { range: [49, 64], name: 'ROUND_OF_32' },
      { range: [65, 72], name: 'ROUND_OF_16' },
      { range: [73, 76], name: 'QUARTERFINALS' },
      { range: [77, 78], name: 'SEMIFINALS' },
      { range: [79, 79], name: 'FINAL' },
      { range: [80, 80], name: 'THIRD_PLACE' },
    ];

    // 1. Pass 1: Upsert all matches to ensure they exist
    for (const ph of phases) {
      const [start, end] = ph.range;
      for (let num = start; num <= end; num++) {
        await prisma.match.upsert({
          where: { externalId: `match-${num}` },
          update: {
            phase: ph.name as any,
            matchNumber: num,
          },
          create: {
            externalId: `match-${num}`,
            phase: ph.name as any,
            matchNumber: num,
            matchDate: new Date(`2026-06-${15 + Math.floor(num/10)}T18:00:00Z`), // Default dates distributed
            status: 'PENDING',
          },
        });
      }
    }

    // Fetch all bracket matches
    const allMatches = await prisma.match.findMany({
      where: {
        matchNumber: { gte: 49, lte: 80 },
      },
    });

    const getMatchByNumber = (num: number) => allMatches.find(m => m.matchNumber === num);

    // 2. Pass 2: Establish progression links (nextMatchId)
    // Round of 32 -> Round of 16
    for (let r32Num = 49; r32Num <= 64; r32Num++) {
      const r16Num = 65 + Math.floor((r32Num - 49) / 2);
      const slot = (r32Num % 2 === 1) ? 'A' : 'B';
      const currentMatch = getMatchByNumber(r32Num);
      const nextMatch = getMatchByNumber(r16Num);

      if (currentMatch && nextMatch) {
        await prisma.match.update({
          where: { id: currentMatch.id },
          data: {
            nextMatchId: nextMatch.id,
            nextMatchSlot: slot,
          },
        });
      }
    }

    // Round of 16 -> Quarterfinals
    for (let r16Num = 65; r16Num <= 72; r16Num++) {
      const qfNum = 73 + Math.floor((r16Num - 65) / 2);
      const slot = (r16Num % 2 === 1) ? 'A' : 'B';
      const currentMatch = getMatchByNumber(r16Num);
      const nextMatch = getMatchByNumber(qfNum);

      if (currentMatch && nextMatch) {
        await prisma.match.update({
          where: { id: currentMatch.id },
          data: {
            nextMatchId: nextMatch.id,
            nextMatchSlot: slot,
          },
        });
      }
    }

    // Quarterfinals -> Semifinals
    for (let qfNum = 73; qfNum <= 76; qfNum++) {
      const sfNum = 77 + Math.floor((qfNum - 73) / 2);
      const slot = (qfNum % 2 === 1) ? 'A' : 'B';
      const currentMatch = getMatchByNumber(qfNum);
      const nextMatch = getMatchByNumber(sfNum);

      if (currentMatch && nextMatch) {
        await prisma.match.update({
          where: { id: currentMatch.id },
          data: {
            nextMatchId: nextMatch.id,
            nextMatchSlot: slot,
          },
        });
      }
    }

    // Semifinals -> Final (winners go to 79) and Third Place (losers go to 80)
    for (let sfNum = 77; sfNum <= 78; sfNum++) {
      const finalMatch = getMatchByNumber(79);
      const slot = (sfNum === 77) ? 'A' : 'B';
      const currentMatch = getMatchByNumber(sfNum);

      if (currentMatch && finalMatch) {
        await prisma.match.update({
          where: { id: currentMatch.id },
          data: {
            nextMatchId: finalMatch.id,
            nextMatchSlot: slot,
          },
        });
      }
    }
  }

  // Populate Round of 32 matches with qualified teams
  async generateRoundOf32Pairs(): Promise<void> {
    // Ensure all matches exist and are linked first
    await this.initializeBracketMatches();

    // Get qualified teams from classification service
    const { firstPlaces, secondPlaces, thirdPlaces } = await classificationService.getQualifiedTeams();

    // Group first, second and third places
    // Sorting first places A to L, second places A to L
    const sorted1sts = [...firstPlaces].sort((a, b) => a.groupLetter.localeCompare(b.groupLetter));
    const sorted2nds = [...secondPlaces].sort((a, b) => a.groupLetter.localeCompare(b.groupLetter));
    const thirds = [...thirdPlaces]; // already sorted by best records

    // Let's create the pairs according to our agreed deterministic scheme
    // Match 49 to 56: 1sts vs best 3rds
    // Match 57 to 60: 1sts vs 2nds (2A to 2D)
    // Match 61 to 64: 2nds vs 2nds (2E vs 2F, 2G vs 2H, 2I vs 2J, 2K vs 2L)
    
    // We have 12 first places. 8 go to matches 49-56, 4 go to matches 57-60.
    // We have 12 second places. 4 go to matches 57-60, 8 go to matches 61-64.

    const pairs: { matchNumber: number; teamAId: number; teamBId: number }[] = [];

    // Matches 49 - 56: 1sts vs 3rds
    for (let i = 0; i < 8; i++) {
      const teamA = sorted1sts[i];
      const teamB = thirds[i];
      if (teamA && teamB) {
        pairs.push({
          matchNumber: 49 + i,
          teamAId: teamA.id,
          teamBId: teamB.id,
        });
      }
    }

    // Matches 57 - 60: 1sts (remaining 4: I, J, K, L) vs 2nds (first 4: A, B, C, D)
    // sorted1sts[8] is 1I, sorted2nds[0] is 2A, etc.
    for (let i = 0; i < 4; i++) {
      const teamA = sorted1sts[8 + i];
      const teamB = sorted2nds[i];
      if (teamA && teamB) {
        pairs.push({
          matchNumber: 57 + i,
          teamAId: teamA.id,
          teamBId: teamB.id,
        });
      }
    }

    // Matches 61 - 64: 2nds vs 2nds
    // 2E vs 2F, 2G vs 2H, 2I vs 2J, 2K vs 2L
    // sorted2nds[4] is 2E, sorted2nds[5] is 2F, etc.
    for (let i = 0; i < 4; i++) {
      const teamA = sorted2nds[4 + i * 2];
      const teamB = sorted2nds[5 + i * 2];
      if (teamA && teamB) {
        pairs.push({
          matchNumber: 61 + i,
          teamAId: teamA.id,
          teamBId: teamB.id,
        });
      }
    }

    // Apply pairs to database
    for (const pair of pairs) {
      const match = await prisma.match.findFirst({
        where: { matchNumber: pair.matchNumber },
      });

      if (match && !match.isManualOverride) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            teamAId: pair.teamAId,
            teamBId: pair.teamBId,
          },
        });
      }
    }
  }
}

export const bracketService = new BracketService();
