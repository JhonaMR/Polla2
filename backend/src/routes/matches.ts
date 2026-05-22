import { Router } from 'express';
import { matchController } from '../controllers/matchController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res, next) => {
  matchController.getMatches(req as any, res).catch(next);
});

router.get('/status/upcoming', authMiddleware, (req, res, next) => {
  matchController.getUpcomingMatches(req as any, res).catch(next);
});

router.get('/status/finished', authMiddleware, (req, res, next) => {
  matchController.getFinishedMatches(req as any, res).catch(next);
});

router.get('/phase/:phase', authMiddleware, (req, res, next) => {
  matchController.getMatchesByPhase(req as any, res).catch(next);
});

router.get('/:id', authMiddleware, (req, res, next) => {
  matchController.getMatch(req as any, res).catch(next);
});

export default router;
