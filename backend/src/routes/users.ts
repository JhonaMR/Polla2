import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/me', authMiddleware, (req, res, next) => {
  userController.getMe(req, res).catch(next);
});

router.get('/profile/:userId', authMiddleware, (req, res, next) => {
  userController.getProfile(req, res).catch(next);
});

router.get('/leaderboard', authMiddleware, (req, res, next) => {
  userController.getLeaderboard(req, res).catch(next);
});

router.put('/profile', authMiddleware, (req, res, next) => {
  userController.updateProfile(req, res).catch(next);
});

router.get('/stats', authMiddleware, (req, res, next) => {
  userController.getStats(req, res).catch(next);
});

export default router;
