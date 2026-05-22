import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../config/database.js';

export class MatchController {
  async getMatches(req: AuthRequest, res: Response) {
    try {
      const matches = await prisma.match.findMany({
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: { matchDate: 'asc' },
      });

      res.status(200).json({
        message: 'Matches retrieved',
        data: matches,
      });
    } catch (error) {
      throw error;
    }
  }

  async getMatch(req: AuthRequest, res: Response) {
    try {
      const id = parseInt((req.params as any).id, 10);
      const match = await prisma.match.findUnique({
        where: { id: id },
        include: {
          teamA: true,
          teamB: true,
        },
      });

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      res.status(200).json({
        message: 'Match retrieved',
        data: match,
      });
    } catch (error) {
      throw error;
    }
  }

  async getMatchesByPhase(req: AuthRequest, res: Response) {
    try {
      const matches = await prisma.match.findMany({
        where: { phase: ((req.params as any).phase.toUpperCase()) as any },
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: { matchDate: 'asc' },
      });

      res.status(200).json({
        message: 'Matches retrieved',
        data: matches,
      });
    } catch (error) {
      throw error;
    }
  }

  async getUpcomingMatches(req: AuthRequest, res: Response) {
    try {
      const matches = await prisma.match.findMany({
        where: { status: 'PENDING' },
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: { matchDate: 'asc' },
      });

      res.status(200).json({
        message: 'Upcoming matches retrieved',
        data: matches,
      });
    } catch (error) {
      throw error;
    }
  }

  async getFinishedMatches(req: AuthRequest, res: Response) {
    try {
      const matches = await prisma.match.findMany({
        where: { status: 'FINISHED' },
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: { matchDate: 'desc' },
      });

      res.status(200).json({
        message: 'Finished matches retrieved',
        data: matches,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const matchController = new MatchController();
