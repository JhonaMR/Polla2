import { prisma } from '../config/database.js';

export interface GroupStanding {
  teamId: number;
  name: string;
  logoUrl: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export interface QualifiedTeamsResult {
  firstPlaces: any[];
  secondPlaces: any[];
  thirdPlaces: any[];
  allQualified: any[];
}

export class ClassificationService {
  // Calculate standings for a specific group letter (A to L)
  async calculateGroupStandings(groupLetter: string): Promise<GroupStanding[]> {
    const letter = groupLetter.toUpperCase();
    
    // Fetch all teams in this group
    const teams = await prisma.team.findMany({
      where: { groupLetter: letter },
    });

    // Fetch all finished group matches for this group
    const matches = await prisma.match.findMany({
      where: {
        phase: 'GROUPS',
        status: 'FINISHED',
        teamA: { groupLetter: letter },
      },
      include: {
        teamA: true,
        teamB: true,
      },
    });

    // Initialize standings map
    const standingsMap: Record<number, Omit<GroupStanding, 'position'>> = {};
    for (const team of teams) {
      standingsMap[team.id] = {
        teamId: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    }

    // Process finished matches
    for (const match of matches) {
      const { teamAId, teamBId, scoreA, scoreB } = match;
      if (teamAId === null || teamBId === null || scoreA === null || scoreB === null) {
        continue;
      }

      const teamA = standingsMap[teamAId];
      const teamB = standingsMap[teamBId];

      if (!teamA || !teamB) continue;

      teamA.played += 1;
      teamB.played += 1;

      teamA.goalsFor += scoreA;
      teamA.goalsAgainst += scoreB;
      teamB.goalsFor += scoreB;
      teamB.goalsAgainst += scoreA;

      if (scoreA > scoreB) {
        teamA.wins += 1;
        teamA.points += 3;
        teamB.losses += 1;
      } else if (scoreA < scoreB) {
        teamB.wins += 1;
        teamB.points += 3;
        teamA.losses += 1;
      } else {
        teamA.draws += 1;
        teamA.points += 1;
        teamB.draws += 1;
        teamB.points += 1;
      }
    }

    // Convert map to array and calculate goal difference
    const standings = Object.values(standingsMap).map(std => {
      std.goalDifference = std.goalsFor - std.goalsAgainst;
      return std;
    });

    // Sort standings:
    // 1. Points (descending)
    // 2. Goal Difference (descending)
    // 3. Goals For (descending)
    // 4. Name (ascending, as final tiebreaker)
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });

    // Assign positions
    return standings.map((std, index) => ({
      ...std,
      position: index + 1,
    }));
  }

  // Get all qualified teams from the group stage
  async getQualifiedTeams(): Promise<QualifiedTeamsResult> {
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const firstPlaces: any[] = [];
    const secondPlaces: any[] = [];
    const allThirdPlaces: any[] = [];

    // Calculate standings for each group
    for (const letter of groupLetters) {
      const standings = await this.calculateGroupStandings(letter);
      
      const first = standings.find(s => s.position === 1);
      const second = standings.find(s => s.position === 2);
      const third = standings.find(s => s.position === 3);

      if (first) {
        const teamObj = await prisma.team.findUnique({ where: { id: first.teamId } });
        if (teamObj) firstPlaces.push(teamObj);
      }
      if (second) {
        const teamObj = await prisma.team.findUnique({ where: { id: second.teamId } });
        if (teamObj) secondPlaces.push(teamObj);
      }
      if (third) {
        const teamObj = await prisma.team.findUnique({ where: { id: third.teamId } });
        if (teamObj) {
          // Store third place along with its stats to sort them later
          allThirdPlaces.push({
            team: teamObj,
            points: third.points,
            goalDifference: third.goalDifference,
            goalsFor: third.goalsFor,
          });
        }
      }
    }

    // Sort third places to select the best 8:
    // 1. Points (descending)
    // 2. Goal Difference (descending)
    // 3. Goals For (descending)
    allThirdPlaces.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.name.localeCompare(b.team.name);
    });

    const bestThirdPlaces = allThirdPlaces.slice(0, 8).map(item => item.team);

    // Merge all qualified teams (12 first + 12 second + 8 third = 32 teams)
    const allQualified = [...firstPlaces, ...secondPlaces, ...bestThirdPlaces];

    return {
      firstPlaces,
      secondPlaces,
      thirdPlaces: bestThirdPlaces,
      allQualified,
    };
  }
}

export const classificationService = new ClassificationService();
