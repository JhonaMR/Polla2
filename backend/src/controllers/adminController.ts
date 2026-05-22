import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, schemas } from '../utils/validators.js';
import { matchProgressionService } from '../services/matchProgressionService.js';
import { pointsService } from '../services/pointsService.js';
import { hashPassword } from '../utils/password.js';

export class AdminController {
  // Get all users with stats
  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          points: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { points: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.user.count();

      res.status(200).json({
        message: 'Users retrieved',
        data: {
          users,
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Update user credentials, role, status
  async updateUser(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const { username, displayName, password, role, isActive } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      const updateData: any = {};

      if (username !== undefined) {
        const cleanUsername = username.trim().toUpperCase();
        if (cleanUsername !== existingUser.username) {
          const taken = await prisma.user.findUnique({
            where: { username: cleanUsername },
          });
          if (taken) {
            throw new AppError('El código de 3 letras ya está en uso', 400);
          }
        }
        updateData.username = cleanUsername;
      }

      if (displayName !== undefined) {
        updateData.displayName = displayName.trim().toUpperCase();
      }

      if (role !== undefined) {
        if (role !== 'ADMIN' && role !== 'USER') {
          throw new AppError('Rol inválido', 400);
        }
        updateData.role = role;
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      if (password !== undefined && password.trim() !== '') {
        updateData.passwordHash = await hashPassword(password);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          displayName: true,
          points: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      console.log(`[ADMIN] User updated: ${updatedUser.id} - ${updatedUser.username}`);

      res.status(200).json({
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get all teams
  async getTeams(req: AuthRequest, res: Response) {
    try {
      const teams = await prisma.team.findMany({
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        message: 'Teams retrieved',
        data: teams,
      });
    } catch (error) {
      throw error;
    }
  }

  // Create a new team
  async createTeam(req: AuthRequest, res: Response) {
    try {
      const { name, region, group, logoUrl } = req.body;

      if (!name || !region || !group) {
        throw new AppError('Name, region, and group are required', 400);
      }

      const team = await prisma.team.create({
        data: {
          externalId: `team-${Date.now()}`,
          name,
          region,
          groupLetter: group.toUpperCase().charAt(0),
          logoUrl: logoUrl || null,
        },
      });

      console.log(`[ADMIN] Team created: ${team.id} - ${team.name}`);

      res.status(201).json({
        message: 'Team created successfully',
        data: team,
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete a team
  async deleteTeam(req: AuthRequest, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId, 10);

      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      await prisma.team.delete({ where: { id: teamId } });

      console.log(`[ADMIN] Team deleted: ${teamId}`);

      res.status(200).json({
        message: 'Team deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Update a team
  async updateTeam(req: AuthRequest, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const data = validate(schemas.updateTeam, req.body);

      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      const updateData: any = { ...data };
      if (data.groupLetter) {
        updateData.groupLetter = data.groupLetter.toUpperCase().charAt(0);
      }

      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: updateData,
      });

      console.log(`[ADMIN] Team updated: ${teamId} - ${updatedTeam.name}`);

      res.status(200).json({
        message: 'Team updated successfully',
        data: updatedTeam,
      });
    } catch (error) {
      throw error;
    }
  }

  // Create a new match
  async createMatch(req: AuthRequest, res: Response) {
    try {
      const data = validate(schemas.createMatch, req.body);

      // Verify teams exist
      const teamA = await prisma.team.findUnique({ where: { id: data.teamAId } });
      const teamB = await prisma.team.findUnique({ where: { id: data.teamBId } });

      if (!teamA || !teamB) {
        throw new AppError('One or both teams not found', 404);
      }

      const match = await prisma.match.create({
        data: {
          externalId: `match-${Date.now()}`,
          phase: data.phase,
          teamAId: data.teamAId,
          teamBId: data.teamBId,
          matchDate: new Date(data.matchDate),
          matchNumber: data.matchNumber,
          status: 'PENDING',
        },
        include: {
          teamA: true,
          teamB: true,
        },
      });

      console.log(`[ADMIN] Match created: ${match.id} - ${match.teamA?.name || 'TBD'} vs ${match.teamB?.name || 'TBD'}`);

      res.status(201).json({
        message: 'Match created successfully',
        data: match,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update a match
  async updateMatch(req: AuthRequest, res: Response) {
    try {
      const matchId = parseInt(req.params.matchId, 10);
      const { phase, teamAId, teamBId, matchDate, matchNumber } = req.body;

      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) {
        throw new AppError('Match not found', 404);
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          phase: phase || match.phase,
          teamAId: teamAId !== undefined ? (teamAId ? parseInt(teamAId, 10) : null) : match.teamAId,
          teamBId: teamBId !== undefined ? (teamBId ? parseInt(teamBId, 10) : null) : match.teamBId,
          matchDate: matchDate ? new Date(matchDate) : match.matchDate,
          matchNumber: matchNumber !== undefined ? parseInt(matchNumber, 10) : match.matchNumber,
        },
        include: {
          teamA: true,
          teamB: true,
        },
      });

      console.log(`[ADMIN] Match updated: ${matchId}`);

      res.status(200).json({
        message: 'Match updated successfully',
        data: updatedMatch,
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete a match
  async deleteMatch(req: AuthRequest, res: Response) {
    try {
      const matchId = parseInt(req.params.matchId, 10);

      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) {
        throw new AppError('Match not found', 404);
      }

      if (match.status !== 'PENDING') {
        throw new AppError('Cannot delete finished matches', 400);
      }

      // Delete all predictions for this match
      await prisma.prediction.deleteMany({ where: { matchId } });

      // Delete the match
      await prisma.match.delete({ where: { id: matchId } });

      console.log(`[ADMIN] Match deleted: ${matchId}`);

      res.status(200).json({
        message: 'Match deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Revert a finished match
  async revertMatch(req: AuthRequest, res: Response) {
    try {
      const matchId = parseInt(req.params.matchId, 10);

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { predictions: true },
      });

      if (!match) {
        throw new AppError('Match not found', 404);
      }

      if (match.status !== 'FINISHED') {
        throw new AppError('Only finished matches can be reverted', 400);
      }

      // Revert user points
      for (const prediction of match.predictions) {
        await prisma.user.update({
          where: { id: prediction.userId },
          data: {
            points: {
              decrement: prediction.pointsEarned,
            },
          },
        });
      }

      // Revert progressed slots in bracket
      await matchProgressionService.revertMatchProgression(matchId);

      // Reset match
      const revertedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'PENDING',
          scoreA: null,
          scoreB: null,
          winnerTeamId: null,
          loserTeamId: null,
        },
        include: {
          teamA: true,
          teamB: true,
        },
      });

      // Reset predictions
      await prisma.prediction.updateMany({
        where: { matchId },
        data: {
          pointsEarned: 0,
          isCorrect: false,
        },
      });

      console.log(`[ADMIN] Match reverted: ${matchId}`);

      res.status(200).json({
        message: 'Match reverted successfully',
        data: revertedMatch,
      });
    } catch (error) {
      throw error;
    }
  }

  // Finish a match and calculate scores
  async finishMatch(req: AuthRequest, res: Response) {
    try {
      const matchId = parseInt(req.params.matchId, 10);
      const { scoreA, scoreB, winnerTeamId, loserTeamId } = validate(schemas.updateMatch, req.body);

      if (scoreA === undefined || scoreB === undefined) {
        throw new AppError('Both scores are required', 400);
      }

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          teamA: true,
          teamB: true,
          predictions: true,
        },
      });

      if (!match) {
        throw new AppError('Match not found', 404);
      }

      // Update match
      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          scoreA,
          scoreB,
          status: 'FINISHED',
          winnerTeamId: winnerTeamId || null,
          loserTeamId: loserTeamId || null,
        },
        include: {
          teamA: true,
          teamB: true,
        },
      });

      // Call progression service to advance winner
      await matchProgressionService.handleMatchProgression(matchId, winnerTeamId, loserTeamId);

      // Calculate points for predictions
      const predictions = await prisma.prediction.findMany({
        where: { matchId },
      });

      const pointsConfig = await pointsService.getConfig();

      for (const prediction of predictions) {
        let pointsEarned = 0;
        let isCorrect = false;

        // Exact score match
        if (prediction.predictedScoreA === scoreA && prediction.predictedScoreB === scoreB) {
          pointsEarned = pointsConfig.aciertoCompleto;
          isCorrect = true;
        }
        // Correct winner
        else if (
          (scoreA > scoreB && prediction.predictedScoreA > prediction.predictedScoreB) ||
          (scoreA < scoreB && prediction.predictedScoreA < prediction.predictedScoreB) ||
          (scoreA === scoreB && prediction.predictedScoreA === prediction.predictedScoreB)
        ) {
          pointsEarned = pointsConfig.acierto;
          isCorrect = true;
        }

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

      console.log(`[ADMIN] Match finished: ${matchId} - Score: ${scoreA}-${scoreB}, ${predictions.length} predictions calculated`);

      res.status(200).json({
        message: 'Match finished and scores calculated',
        data: {
          match: updatedMatch,
          predictionsCalculated: predictions.length,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Create bonus question
  async createBonusQuestion(req: AuthRequest, res: Response) {
    try {
      const data = validate(schemas.createBonusQuestion, req.body);

      const question = await prisma.bonusQuestion.create({
        data: {
          question: data.question,
          correctAnswer: data.correctAnswer,
          category: data.category,
          isActive: true,
        },
      });

      console.log(`[ADMIN] Bonus question created: ${question.id}`);

      res.status(201).json({
        message: 'Bonus question created successfully',
        data: question,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get all bonus questions
  async getBonusQuestions(req: AuthRequest, res: Response) {
    try {
      const questions = await prisma.bonusQuestion.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        message: 'Bonus questions retrieved',
        data: questions,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get predictions for a specific bonus question
  async getBonusQuestionPredictions(req: AuthRequest, res: Response) {
    try {
      const questionId = parseInt(req.params.questionId, 10);

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
        message: 'Bonus predictions retrieved',
        data: predictions,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update bonus question
  async updateBonusQuestion(req: AuthRequest, res: Response) {
    try {
      const questionId = parseInt(req.params.questionId, 10);
      const data = validate(schemas.updateBonusQuestion, req.body);

      const questionBefore = await prisma.bonusQuestion.findUnique({
        where: { id: questionId },
      });

      const question = await prisma.bonusQuestion.update({
        where: { id: questionId },
        data,
      });

      // Grade predictions and adjust user points if correct answer changed
      if (data.correctAnswer !== undefined && data.correctAnswer !== questionBefore?.correctAnswer) {
        const predictions = await prisma.bonusPrediction.findMany({
          where: { questionId },
        });

        const pointsConfig = await pointsService.getConfig();

        for (const pred of predictions) {
          const isCorrect = data.correctAnswer 
            ? pred.selectedAnswer.toLowerCase() === data.correctAnswer.toLowerCase()
            : false;
          const pointsEarned = isCorrect ? pointsConfig.pregunta : 0;

          await prisma.bonusPrediction.update({
            where: { id: pred.id },
            data: {
              isCorrect,
              pointsEarned,
            },
          });

          const diff = pointsEarned - pred.pointsEarned;
          if (diff !== 0) {
            await prisma.user.update({
              where: { id: pred.userId },
              data: {
                points: {
                  increment: diff,
                },
              },
            });
          }
        }
      }

      console.log(`[ADMIN] Bonus question updated: ${questionId}`);

      res.status(200).json({
        message: 'Bonus question updated successfully',
        data: question,
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete bonus question
  async deleteBonusQuestion(req: AuthRequest, res: Response) {
    try {
      const questionId = parseInt(req.params.questionId, 10);

      const question = await prisma.bonusQuestion.findUnique({ where: { id: questionId } });
      if (!question) {
        throw new AppError('Question not found', 404);
      }

      // Delete all predictions for this question
      await prisma.bonusPrediction.deleteMany({ where: { questionId } });

      // Delete the question
      await prisma.bonusQuestion.delete({ where: { id: questionId } });

      console.log(`[ADMIN] Bonus question deleted: ${questionId}`);

      res.status(200).json({
        message: 'Bonus question deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Update bonus prediction (admin can edit user answers)
  async updateBonusPrediction(req: AuthRequest, res: Response) {
    try {
      const predictionId = parseInt(req.params.predictionId, 10);
      const { selectedAnswer } = req.body;

      const prediction = await prisma.bonusPrediction.findUnique({
        where: { id: predictionId },
        include: { question: true, user: true },
      });

      if (!prediction) {
        throw new AppError('Prediction not found', 404);
      }

      const pointsConfig = await pointsService.getConfig();
      const oldPointsEarned = prediction.pointsEarned;
      const isCorrect = prediction.question.correctAnswer 
        ? selectedAnswer.toLowerCase() === prediction.question.correctAnswer.toLowerCase()
        : false;
      const pointsEarned = isCorrect ? pointsConfig.pregunta : 0;

      // Update prediction
      const updatedPrediction = await prisma.bonusPrediction.update({
        where: { id: predictionId },
        data: {
          selectedAnswer,
          isCorrect,
          pointsEarned,
        },
      });

      // Adjust user points
      const pointsDifference = pointsEarned - oldPointsEarned;
      if (pointsDifference !== 0) {
        await prisma.user.update({
          where: { id: prediction.userId },
          data: {
            points: {
              increment: pointsDifference,
            },
          },
        });
      }

      console.log(`[ADMIN] Bonus prediction updated: ${predictionId}`);

      res.status(200).json({
        message: 'Bonus prediction updated successfully',
        data: updatedPrediction,
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete bonus prediction
  async deleteBonusPrediction(req: AuthRequest, res: Response) {
    try {
      const predictionId = parseInt(req.params.predictionId, 10);

      const prediction = await prisma.bonusPrediction.findUnique({ where: { id: predictionId } });
      if (!prediction) {
        throw new AppError('Prediction not found', 404);
      }

      // Revert user points
      await prisma.user.update({
        where: { id: prediction.userId },
        data: {
          points: {
            decrement: prediction.pointsEarned,
          },
        },
      });

      // Delete prediction
      await prisma.bonusPrediction.delete({ where: { id: predictionId } });

      console.log(`[ADMIN] Bonus prediction deleted: ${predictionId}`);

      res.status(200).json({
        message: 'Bonus prediction deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // Calculate all scores (recalculate points for all users)
  async calculateScores(req: AuthRequest, res: Response) {
    try {
      console.log('[ADMIN] Starting score recalculation...');

      // Reset all user points
      await prisma.user.updateMany({
        data: { points: 0 },
      });

      // Get all finished matches with predictions
      const finishedMatches = await prisma.match.findMany({
        where: { status: 'FINISHED' },
        include: {
          predictions: true,
        },
      });

      let totalPointsDistributed = 0;

      for (const match of finishedMatches) {
        for (const prediction of match.predictions) {
          if (prediction.isCorrect) {
            await prisma.user.update({
              where: { id: prediction.userId },
              data: {
                points: {
                  increment: prediction.pointsEarned,
                },
              },
            });
            totalPointsDistributed += prediction.pointsEarned;
          }
        }
      }

      // Get bonus predictions
      const bonusPredictions = await prisma.bonusPrediction.findMany({
        where: { isCorrect: true },
      });

      for (const bonus of bonusPredictions) {
        await prisma.user.update({
          where: { id: bonus.userId },
          data: {
            points: {
              increment: bonus.pointsEarned,
            },
          },
        });
        totalPointsDistributed += bonus.pointsEarned;
      }

      console.log(`[ADMIN] Score recalculation completed. Total points distributed: ${totalPointsDistributed}`);

      res.status(200).json({
        message: 'Scores recalculated successfully',
        data: {
          matchesProcessed: finishedMatches.length,
          bonusProcessed: bonusPredictions.length,
          totalPointsDistributed,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get dashboard stats
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({ where: { isActive: true } });
      const totalMatches = await prisma.match.count();
      const finishedMatches = await prisma.match.count({ where: { status: 'FINISHED' } });
      const totalPredictions = await prisma.prediction.count();
      const correctPredictions = await prisma.prediction.count({ where: { isCorrect: true } });
      const totalBonusQuestions = await prisma.bonusQuestion.count();
      const activeBonusQuestions = await prisma.bonusQuestion.count({ where: { isActive: true } });

      const topUsers = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          points: true,
        },
        orderBy: { points: 'desc' },
        take: 5,
      });

      res.status(200).json({
        message: 'Dashboard stats retrieved',
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
          },
          matches: {
            total: totalMatches,
            finished: finishedMatches,
            pending: totalMatches - finishedMatches,
          },
          predictions: {
            total: totalPredictions,
            correct: correctPredictions,
            accuracy: totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(2) : 0,
          },
          bonusQuestions: {
            total: totalBonusQuestions,
            active: activeBonusQuestions,
          },
          topUsers,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get points configuration
  async getPointsConfig(req: AuthRequest, res: Response) {
    try {
      const config = await pointsService.getConfig();
      res.status(200).json({
        message: 'Points configuration retrieved',
        data: config,
      });
    } catch (error) {
      throw error;
    }
  }

  // Update points configuration
  async updatePointsConfig(req: AuthRequest, res: Response) {
    try {
      const { acierto, aciertoCompleto, pregunta } = req.body;
      const config = await pointsService.updateConfig(
        parseInt(acierto, 10),
        parseInt(aciertoCompleto, 10),
        parseInt(pregunta, 10)
      );
      res.status(200).json({
        message: 'Points configuration updated successfully',
        data: config,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const adminController = new AdminController();
