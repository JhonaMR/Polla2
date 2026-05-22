import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { userService } from '../services/userService.js';

export class UserController {
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await userService.getUserProfile(req.user.id);

      res.status(200).json({
        message: 'User profile retrieved',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const user = await userService.getUserProfile(userId);

      res.status(200).json({
        message: 'User profile retrieved',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const leaderboard = await userService.getLeaderboard(limit, offset);

      res.status(200).json({
        message: 'Leaderboard retrieved',
        data: leaderboard,
      });
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { displayName, photoUrl } = req.body;
      const user = await userService.updateUserProfile(req.user.id, {
        displayName,
        photoUrl,
      });

      res.status(200).json({
        message: 'User profile updated',
        data: user,
      });
    } catch (error) {
      throw error;
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const stats = await userService.getUserStats(req.user.id);

      res.status(200).json({
        message: 'User stats retrieved',
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const userController = new UserController();
