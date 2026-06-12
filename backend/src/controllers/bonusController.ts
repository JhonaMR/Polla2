import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { pointsService } from '../services/pointsService.js';

export class BonusController {
  async getQuestions(req: AuthRequest, res: Response) {
    try {
      const questions = await prisma.bonusQuestion.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({
        message: 'Bonus questions retrieved',
        data: questions,
      });
    } catch (error) {
      throw error;
    }
  }

  async getQuestion(req: AuthRequest, res: Response) {
    try {
      const id = parseInt((req.params as any).id, 10);
      const question = await prisma.bonusQuestion.findUnique({
        where: { id },
      });

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      res.status(200).json({
        message: 'Question retrieved',
        data: question,
      });
    } catch (error) {
      throw error;
    }
  }

  async createPrediction(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { questionId, selectedAnswer } = (req.body as any);
      const userId = req.user.id;

      // Check lock deadline: June 15, 2026 at 23:59:59 local time (GMT-5)
      const deadline = new Date('2026-06-15T23:59:59-05:00');
      const now = new Date();

      if (now > deadline) {
        throw new AppError('Su elección está bloqueada, no es posible editar su elección para este encuentro', 400);
      }

      const question = await prisma.bonusQuestion.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      const existingPrediction = await prisma.bonusPrediction.findUnique({
        where: {
          userId_questionId: { userId, questionId },
        },
      });

      const pointsConfig = await pointsService.getConfig();

      const isCorrect = question.correctAnswer 
        ? selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase() 
        : false;
      const pointsEarned = isCorrect ? pointsConfig.pregunta : 0;

      let prediction;
      if (existingPrediction) {
        // Update existing prediction
        prediction = await prisma.bonusPrediction.update({
          where: { id: existingPrediction.id },
          data: {
            selectedAnswer,
            isCorrect,
            pointsEarned,
          },
        });

        // Adjust user points if they changed
        const pointsDifference = pointsEarned - existingPrediction.pointsEarned;
        if (pointsDifference !== 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: pointsDifference } },
          });
        }
      } else {
        // Create new prediction
        prediction = await prisma.bonusPrediction.create({
          data: {
            userId,
            questionId,
            selectedAnswer,
            isCorrect,
            pointsEarned,
          },
        });

        if (isCorrect) {
          await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: pointsEarned } },
          });
        }
      }

      res.status(200).json({
        message: existingPrediction ? 'Bonus prediction updated' : 'Bonus prediction created',
        data: prediction,
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserPredictions(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt((req.params as any).userId, 10);
      const predictions = await prisma.bonusPrediction.findMany({
        where: { userId },
        include: { question: true },
      });

      res.status(200).json({
        message: 'User bonus predictions retrieved',
        data: predictions,
      });
    } catch (error) {
      throw error;
    }
  }

  async getQuestionPredictions(req: AuthRequest, res: Response) {
    try {
      const questionId = parseInt((req.params as any).id, 10);
      const predictions = await prisma.bonusPrediction.findMany({
        where: { questionId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: {
          user: {
            username: 'asc',
          },
        },
      });

      res.status(200).json({
        message: 'Predictions retrieved',
        data: predictions,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const bonusController = new BonusController();
