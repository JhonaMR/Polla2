import { prisma } from '../config/database.js';

export class MatchProgressionService {
  async handleMatchProgression(matchId: number, winnerTeamId?: number, loserTeamId?: number): Promise<void> {
    // 1. Fetch match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: true,
        teamB: true,
      }
    });

    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }

    // Only process progression for knockout stages
    if (match.phase === 'GROUPS') {
      return;
    }

    // Determine winner/loser
    let finalWinnerId = winnerTeamId;
    let finalLoserId = loserTeamId;

    if (!finalWinnerId || !finalLoserId) {
      if (match.scoreA !== null && match.scoreB !== null) {
        if (match.scoreA > match.scoreB) {
          finalWinnerId = match.teamAId || undefined;
          finalLoserId = match.teamBId || undefined;
        } else if (match.scoreB > match.scoreA) {
          finalWinnerId = match.teamBId || undefined;
          finalLoserId = match.teamAId || undefined;
        }
      }
    }

    // If it's a draw and no winner was provided, we cannot progress
    if (!finalWinnerId && match.scoreA === match.scoreB) {
      throw new Error(`Knockout match ${match.matchNumber} cannot end in a draw without a specified winner/loser.`);
    }

    if (!finalWinnerId) {
      // Still no winner ID determined (maybe match teams aren't set yet)
      return;
    }

    // Save winner/loser IDs in current match if not saved yet
    await prisma.match.update({
      where: { id: match.id },
      data: {
        winnerTeamId: finalWinnerId,
        loserTeamId: finalLoserId,
      }
    });

    // 2. Progress winner to next match if exists
    if (match.nextMatchId) {
      const nextMatch = await prisma.match.findUnique({
        where: { id: match.nextMatchId }
      });

      if (nextMatch && !nextMatch.isManualOverride) {
        const slotField = match.nextMatchSlot === 'A' ? 'teamAId' : 'teamBId';
        await prisma.match.update({
          where: { id: nextMatch.id },
          data: {
            [slotField]: finalWinnerId
          }
        });
        console.log(`[PROGRESSION] Advanced Team ${finalWinnerId} to Match ${nextMatch.matchNumber} slot ${match.nextMatchSlot}`);
      }
    }

    // 3. For Semifinals (Match 77 & 78), also send the loser to Third Place Play-off (Match 80)
    if (match.matchNumber === 77 || match.matchNumber === 78) {
      const thirdPlaceMatch = await prisma.match.findFirst({
        where: { matchNumber: 80 }
      });

      if (thirdPlaceMatch && !thirdPlaceMatch.isManualOverride) {
        const slotField = match.matchNumber === 77 ? 'teamAId' : 'teamBId';
        if (finalLoserId) {
          await prisma.match.update({
            where: { id: thirdPlaceMatch.id },
            data: {
              [slotField]: finalLoserId
            }
          });
          console.log(`[PROGRESSION] Sent loser Team ${finalLoserId} of Semifinal ${match.matchNumber} to Third Place match slot ${slotField === 'teamAId' ? 'A' : 'B'}`);
        }
      }
    }
  }

  async revertMatchProgression(matchId: number): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match || match.phase === 'GROUPS') {
      return;
    }

    const prevWinnerId = match.winnerTeamId;
    const prevLoserId = match.loserTeamId;

    // Reset winner/loser in this match
    await prisma.match.update({
      where: { id: match.id },
      data: {
        winnerTeamId: null,
        loserTeamId: null
      }
    });

    // Reset winner in next match
    if (match.nextMatchId && prevWinnerId) {
      const nextMatch = await prisma.match.findUnique({
        where: { id: match.nextMatchId }
      });

      if (nextMatch && !nextMatch.isManualOverride && nextMatch.status === 'PENDING') {
        const slotField = match.nextMatchSlot === 'A' ? 'teamAId' : 'teamBId';
        // Only clear if the current team matches the previous winner
        const currentTeamInSlot = slotField === 'teamAId' ? nextMatch.teamAId : nextMatch.teamBId;
        if (currentTeamInSlot === prevWinnerId) {
          await prisma.match.update({
            where: { id: nextMatch.id },
            data: {
              [slotField]: null
            }
          });
          console.log(`[PROGRESSION] Cleared slot ${match.nextMatchSlot} from Match ${nextMatch.matchNumber} due to revert`);
        }
      }
    }

    // Reset loser in Third Place match if Semifinal
    if ((match.matchNumber === 77 || match.matchNumber === 78) && prevLoserId) {
      const thirdPlaceMatch = await prisma.match.findFirst({
        where: { matchNumber: 80 }
      });

      if (thirdPlaceMatch && !thirdPlaceMatch.isManualOverride && thirdPlaceMatch.status === 'PENDING') {
        const slotField = match.matchNumber === 77 ? 'teamAId' : 'teamBId';
        const currentTeamInSlot = slotField === 'teamAId' ? thirdPlaceMatch.teamAId : thirdPlaceMatch.teamBId;
        if (currentTeamInSlot === prevLoserId) {
          await prisma.match.update({
            where: { id: thirdPlaceMatch.id },
            data: {
              [slotField]: null
            }
          });
          console.log(`[PROGRESSION] Cleared slot ${slotField === 'teamAId' ? 'A' : 'B'} from Third Place Match 80 due to Semifinal revert`);
        }
      }
    }
  }
}

export const matchProgressionService = new MatchProgressionService();
