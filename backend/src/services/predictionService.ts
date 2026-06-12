import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { pointsService } from './pointsService.js';

export class PredictionService {
  async createPrediction(userId: number, matchId: number, predictedScoreA: number, predictedScoreB: number) {
    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    // Check if match is already finished
    if (match.status === 'FINISHED') {
      throw new AppError('Cannot predict on finished matches', 400);
    }

    // Check Phase Configuration status
    const phaseConfig = await prisma.phaseConfiguration.findUnique({
      where: { phase: match.phase },
    });

    if (!phaseConfig || phaseConfig.status !== 'OPEN_FOR_PREDICTIONS') {
      throw new AppError('Su elección está bloqueada, no es posible editar su elección para este encuentro', 400);
    }

    // Check 15-minute lock rule
    const now = new Date();
    const matchTime = new Date(match.matchDate);
    const fifteenMinutes = 15 * 60 * 1000;

    if (matchTime.getTime() - now.getTime() < fifteenMinutes) {
      throw new AppError('Su elección está bloqueada, no es posible editar su elección para este encuentro', 400);
    }

    // Check if prediction already exists
    const existingPrediction = await prisma.prediction.findUnique({
      where: {
        userId_matchId: { userId, matchId },
      },
    });

    if (existingPrediction) {
      throw new AppError('Prediction already exists for this match', 409);
    }

    // Create prediction
    const prediction = await prisma.prediction.create({
      data: {
        userId,
        matchId,
        predictedScoreA,
        predictedScoreB,
      },
      include: { match: true },
    });

    return prediction;
  }

  async updatePrediction(userId: number, predictionId: number, predictedScoreA: number, predictedScoreB: number) {
    // Get prediction
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: { match: true },
    });

    if (!prediction) {
      throw new AppError('Prediction not found', 404);
    }

    if (prediction.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (prediction.match.status === 'FINISHED') {
      throw new AppError('Cannot update prediction on finished matches', 400);
    }

    // Check Phase Configuration status
    const phaseConfig = await prisma.phaseConfiguration.findUnique({
      where: { phase: prediction.match.phase },
    });

    if (!phaseConfig || phaseConfig.status !== 'OPEN_FOR_PREDICTIONS') {
      throw new AppError('Su elección está bloqueada, no es posible editar su elección para este encuentro', 400);
    }

    // Check 15-minute lock rule
    const now = new Date();
    const matchTime = new Date(prediction.match.matchDate);
    const fifteenMinutes = 15 * 60 * 1000;

    if (matchTime.getTime() - now.getTime() < fifteenMinutes) {
      throw new AppError('Su elección está bloqueada, no es posible editar su elección para este encuentro', 400);
    }

    // Update prediction
    const updatedPrediction = await prisma.prediction.update({
      where: { id: predictionId },
      data: {
        predictedScoreA,
        predictedScoreB,
      },
      include: { match: true },
    });

    return updatedPrediction;
  }

  async getUserPredictions(userId: number, matchId?: number) {
    const predictions = await prisma.prediction.findMany({
      where: {
        userId,
        ...(matchId && { matchId }),
      },
      include: {
        match: {
          include: {
            teamA: true,
            teamB: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return predictions;
  }

  async getMatchPredictions(matchId: number) {
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            points: true,
          },
        },
      },
    });

    return predictions;
  }

  async calculatePredictionScore(matchId: number) {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || match.status !== 'FINISHED' || match.scoreA === null || match.scoreB === null) {
      throw new AppError('Match not finished or scores not set', 400);
    }

    // Get all predictions for this match
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    });

    // Calculate scores
    for (const prediction of predictions) {
      const { pointsEarned, isCorrect } = pointsService.getPointsForMatch(
        match.phase,
        prediction.predictedScoreA,
        prediction.predictedScoreB,
        match.scoreA,
        match.scoreB
      );

      // Update prediction
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          pointsEarned,
          isCorrect,
        },
      });

      // Update user points
      await prisma.user.update({
        where: { id: prediction.userId },
        data: {
          points: {
            increment: pointsEarned,
          },
        },
      });
    }

    return { matchId, predictionsUpdated: predictions.length };
  }

  async getUserPredictionStats(userId: number) {
    const predictions = await prisma.prediction.findMany({
      where: { userId },
    });

    const correctPredictions = predictions.filter(p => p.isCorrect);
    const totalPoints = predictions.reduce((sum, p) => sum + p.pointsEarned, 0);

    return {
      totalPredictions: predictions.length,
      correctPredictions: correctPredictions.length,
      accuracy: predictions.length > 0 ? (correctPredictions.length / predictions.length) * 100 : 0,
      totalPoints,
      averagePointsPerPrediction: predictions.length > 0 ? totalPoints / predictions.length : 0,
    };
  }
}

export const predictionService = new PredictionService();
