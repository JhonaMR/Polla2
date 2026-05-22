import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { bracketService } from '../services/bracketService.js';
import { MatchPhase, PhaseStatus } from '@prisma/client';

export class PhaseController {
  // Get all phase configurations
  async getPhases(req: Request, res: Response) {
    try {
      const phases = await prisma.phaseConfiguration.findMany({
        orderBy: { id: 'asc' },
      });

      res.status(200).json({
        message: 'Phases retrieved successfully',
        data: phases,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update a specific phase configuration
  async updatePhaseStatus(req: Request, res: Response) {
    try {
      const { phase } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      // Validate phase enum
      const validPhases = Object.values(MatchPhase);
      if (!validPhases.includes(phase as MatchPhase)) {
        throw new AppError(`Invalid phase: ${phase}`, 400);
      }

      // Validate status enum
      const validStatuses = Object.values(PhaseStatus);
      if (!validStatuses.includes(status as PhaseStatus)) {
        throw new AppError(`Invalid status: ${status}`, 400);
      }

      const updated = await prisma.phaseConfiguration.upsert({
        where: { phase: phase as MatchPhase },
        update: { status: status as PhaseStatus },
        create: {
          phase: phase as MatchPhase,
          status: status as PhaseStatus,
        },
      });

      console.log(`[ADMIN] Phase ${phase} status updated to ${status}`);

      res.status(200).json({
        message: `Phase ${phase} status updated successfully`,
        data: updated,
      });
    } catch (error) {
      throw error;
    }
  }

  // Process classification of group stages and generate bracket
  async processGroupClassification(req: Request, res: Response) {
    try {
      console.log('[ADMIN] Processing group classifications and generating ROUND_OF_32 brackets...');
      
      // Call bracket service to calculate standings, qualified teams, and fill brackets
      await bracketService.generateRoundOf32Pairs();

      console.log('[ADMIN] ROUND_OF_32 brackets generated successfully');

      res.status(200).json({
        message: 'Group stage classified and ROUND_OF_32 pairings generated successfully',
      });
    } catch (error) {
      console.error('[ADMIN] Error generating bracket pairs:', error);
      throw new AppError(error instanceof Error ? error.message : 'Error generating bracket pairs', 500);
    }
  }
}

export const phaseController = new PhaseController();
