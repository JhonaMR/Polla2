import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class UserService {
  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uid: true,
        username: true,
        displayName: true,
        role: true,
        points: true,
        position: true,
        photoUrl: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async getUserProfile(userId: number) {
    const user = await this.getUserById(userId);

    // Get user stats
    const predictions = await prisma.prediction.findMany({
      where: { userId },
    });

    const bonusPredictions = await prisma.bonusPrediction.findMany({
      where: { userId },
    });

    const correctPredictions = predictions.filter(p => p.isCorrect).length;
    const correctBonusPredictions = bonusPredictions.filter(p => p.isCorrect).length;

    return {
      ...user,
      stats: {
        totalPredictions: predictions.length,
        correctPredictions,
        totalBonusPredictions: bonusPredictions.length,
        correctBonusPredictions,
        pointsFromPredictions: predictions.reduce((sum, p) => sum + p.pointsEarned, 0),
        pointsFromBonus: bonusPredictions.reduce((sum, p) => sum + p.pointsEarned, 0),
      },
    };
  }

  async getLeaderboard(limit: number = 100, offset: number = 0) {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: 'USER' },
      select: {
        id: true,
        username: true,
        displayName: true,
        points: true,
        photoUrl: true,
        position: true,
        predictions: {
          select: {
            pointsEarned: true,
            isCorrect: true,
          },
        },
      },
      orderBy: { points: 'desc' },
      take: limit,
      skip: offset,
    });

    // Add position and stats
    const usersWithPosition = users.map((user, index) => {
      const totalPredictions = user.predictions.length;
      const correctPredictions = user.predictions.filter(p => p.pointsEarned > 0).length;
      const winRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

      // Omit predictions array from the returned structure
      const { predictions, ...userWithoutPredictions } = user;

      return {
        ...userWithoutPredictions,
        position: offset + index + 1,
        stats: {
          totalPredictions,
          correctPredictions,
          winRate: parseFloat(winRate.toFixed(1)),
        },
      };
    });

    return usersWithPosition;
  }

  async updateUserProfile(userId: number, data: { displayName?: string; photoUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        uid: true,
        username: true,
        displayName: true,
        role: true,
        points: true,
        position: true,
        photoUrl: true,
      },
    });

    return user;
  }

  async getUserStats(userId: number) {
    const user = await this.getUserById(userId);

    const predictions = await prisma.prediction.findMany({
      where: { userId },
      include: { match: true },
    });

    const bonusPredictions = await prisma.bonusPrediction.findMany({
      where: { userId },
      include: { question: true },
    });

    const correctPredictions = predictions.filter(p => p.isCorrect);
    const correctBonusPredictions = bonusPredictions.filter(p => p.isCorrect);

    return {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        points: user.points,
      },
      predictions: {
        total: predictions.length,
        correct: correctPredictions.length,
        accuracy: predictions.length > 0 ? (correctPredictions.length / predictions.length) * 100 : 0,
        pointsEarned: predictions.reduce((sum, p) => sum + p.pointsEarned, 0),
      },
      bonusQuestions: {
        total: bonusPredictions.length,
        correct: correctBonusPredictions.length,
        accuracy: bonusPredictions.length > 0 ? (correctBonusPredictions.length / bonusPredictions.length) * 100 : 0,
        pointsEarned: bonusPredictions.reduce((sum, p) => sum + p.pointsEarned, 0),
      },
    };
  }

  async deactivateUser(userId: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return user;
  }
}

export const userService = new UserService();
