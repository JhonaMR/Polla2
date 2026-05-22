import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { predictionService } from '../services/predictionService.js';
import { validate, schemas } from '../utils/validators.js';

export class PredictionController {
  async createPrediction(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data = validate(schemas.createPrediction, req.body);
      const prediction = await predictionService.createPrediction(
        req.user.id,
        data.matchId,
        data.predictedScoreA,
        data.predictedScoreB
      );

      res.status(201).json({
        message: 'Prediction created successfully',
        data: prediction,
      });
    } catch (error) {
      throw error;
    }
  }

  async updatePrediction(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const predictionId = parseInt(req.params.id, 10);
      const data = validate(schemas.updatePrediction, req.body);

      const prediction = await predictionService.updatePrediction(
        req.user.id,
        predictionId,
        data.predictedScoreA,
        data.predictedScoreB
      );

      res.status(200).json({
        message: 'Prediction updated successfully',
        data: prediction,
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserPredictions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = parseInt(req.params.userId, 10);
      const matchId = req.query.matchId ? parseInt(req.query.matchId as string, 10) : undefined;

      const predictions = await predictionService.getUserPredictions(userId, matchId);

      res.status(200).json({
        message: 'User predictions retrieved',
        data: predictions,
      });
    } catch (error) {
      throw error;
    }
  }

  async getMatchPredictions(req: AuthRequest, res: Response) {
    try {
      const matchId = parseInt(req.params.matchId, 10);
      const predictions = await predictionService.getMatchPredictions(matchId);

      res.status(200).json({
        message: 'Match predictions retrieved',
        data: predictions,
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserStats(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const stats = await predictionService.getUserPredictionStats(userId);

      res.status(200).json({
        message: 'User prediction stats retrieved',
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const predictionController = new PredictionController();
