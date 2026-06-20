import { prisma } from '../config/database.js';
import { classificationService } from './classificationService.js';

export class BracketService {
  // Initialize knockout matches 73 to 104 in the DB if they don't exist and link them
  async initializeBracketMatches(): Promise<void> {
    const phases = [
      { range: [73, 88], name: 'ROUND_OF_32' },
      { range: [89, 96], name: 'ROUND_OF_16' },
      { range: [97, 100], name: 'QUARTERFINALS' },
      { range: [101, 102], name: 'SEMIFINALS' },
      { range: [104, 104], name: 'FINAL' },
      { range: [103, 103], name: 'THIRD_PLACE' },
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
            matchDate: new Date(`2026-06-30T18:00:00Z`), // Default fallback date
            status: 'PENDING',
          },
        });
      }
    }

    // Fetch all bracket matches
    const allMatches = await prisma.match.findMany({
      where: {
        matchNumber: { gte: 73, lte: 104 },
      },
    });

    const getMatchByNumber = (num: number) => allMatches.find(m => m.matchNumber === num);

    // 2. Pass 2: Establish progression links (nextMatchId)
    // Round of 32 -> Round of 16
    for (let r32Num = 73; r32Num <= 88; r32Num++) {
      const r16Num = 89 + Math.floor((r32Num - 73) / 2);
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
    for (let r16Num = 89; r16Num <= 96; r16Num++) {
      const qfNum = 97 + Math.floor((r16Num - 89) / 2);
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
    for (let qfNum = 97; qfNum <= 100; qfNum++) {
      const sfNum = 101 + Math.floor((qfNum - 97) / 2);
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

    // Semifinals -> Final (winners go to 104) and Third Place (losers go to 103)
    for (let sfNum = 101; sfNum <= 102; sfNum++) {
      const finalMatch = getMatchByNumber(104);
      const slot = (sfNum === 101) ? 'A' : 'B';
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

    const sorted1sts = [...firstPlaces].sort((a, b) => a.groupLetter.localeCompare(b.groupLetter));
    const sorted2nds = [...secondPlaces].sort((a, b) => a.groupLetter.localeCompare(b.groupLetter));
    const thirds = [...thirdPlaces]; // already sorted by best records

    // User defined specific pairings for M73 to M88
    const pairs: { matchNumber: number; teamA: any; teamB: any }[] = [
      { matchNumber: 73, teamA: sorted2nds[0], teamB: sorted2nds[1] }, // 2A vs 2B
      { matchNumber: 74, teamA: sorted1sts[4], teamB: thirds[0] },      // 1E vs 3rd
      { matchNumber: 75, teamA: sorted1sts[2], teamB: sorted2nds[5] }, // 1C vs 2F
      { matchNumber: 76, teamA: sorted1sts[5], teamB: sorted2nds[2] }, // 1F vs 2C
      { matchNumber: 77, teamA: sorted1sts[8], teamB: thirds[1] },      // 1I vs 3rd
      { matchNumber: 78, teamA: sorted2nds[4], teamB: sorted2nds[8] }, // 2E vs 2I
      { matchNumber: 79, teamA: sorted1sts[0], teamB: thirds[2] },      // 1A vs 3rd
      { matchNumber: 80, teamA: sorted1sts[11], teamB: thirds[3] },     // 1L vs 3rd
      { matchNumber: 81, teamA: sorted1sts[6], teamB: thirds[4] },      // 1G vs 3rd
      { matchNumber: 82, teamA: sorted1sts[3], teamB: thirds[5] },      // 1D vs 3rd
      { matchNumber: 83, teamA: sorted2nds[10], teamB: sorted2nds[11] }, // 2K vs 2L
      { matchNumber: 84, teamA: sorted1sts[7], teamB: sorted2nds[9] },  // 1H vs 2J
      { matchNumber: 85, teamA: sorted1sts[1], teamB: thirds[6] },      // 1B vs 3rd
      { matchNumber: 86, teamA: sorted2nds[3], teamB: sorted2nds[6] },  // 2D vs 2G
      { matchNumber: 87, teamA: sorted1sts[9], teamB: sorted2nds[7] },  // 1J vs 2H
      { matchNumber: 88, teamA: sorted1sts[10], teamB: thirds[7] },     // 1K vs 3rd
    ];

    // Apply pairs to database
    for (const pair of pairs) {
      const match = await prisma.match.findFirst({
        where: { matchNumber: pair.matchNumber },
      });

      if (match && !match.isManualOverride && pair.teamA && pair.teamB) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            teamAId: pair.teamA.id,
            teamBId: pair.teamB.id,
          },
        });
      }
    }
  }
}

export const bracketService = new BracketService();
