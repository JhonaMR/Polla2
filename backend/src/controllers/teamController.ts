import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../config/database.js';

export class TeamController {
  async getTeams(req: AuthRequest, res: Response) {
    try {
      const teams = await prisma.team.findMany({
        orderBy: { groupLetter: 'asc' },
      });

      res.status(200).json({
        message: 'Teams retrieved',
        data: teams,
      });
    } catch (error) {
      throw error;
    }
  }

  async getTeam(req: AuthRequest, res: Response) {
    try {
      const id = parseInt((req.params as any).id, 10);
      const team = await prisma.team.findUnique({
        where: { id },
      });

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.status(200).json({
        message: 'Team retrieved',
        data: team,
      });
    } catch (error) {
      throw error;
    }
  }

  async getTeamsByRegion(req: AuthRequest, res: Response) {
    try {
      const teams = await prisma.team.findMany({
        where: { region: (req.params as any).region },
      });

      res.status(200).json({
        message: 'Teams retrieved',
        data: teams,
      });
    } catch (error) {
      throw error;
    }
  }

  async getTeamsByGroup(req: AuthRequest, res: Response) {
    try {
      const teams = await prisma.team.findMany({
        where: { groupLetter: ((req.params as any).group.toUpperCase()) },
      });

      res.status(200).json({
        message: 'Teams retrieved',
        data: teams,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const teamController = new TeamController();
