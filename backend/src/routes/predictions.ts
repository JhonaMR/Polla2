import { Router } from 'express';
import { predictionController } from '../controllers/predictionController.js';
import { authMiddleware } from '../middleware/auth.js';
import { predictionLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', authMiddleware, predictionLimiter, (req, res, next) => {
  predictionController.createPrediction(req, res).catch(next);
});

router.put('/:id', authMiddleware, predictionLimiter, (req, res, next) => {
  predictionController.updatePrediction(req, res).catch(next);
});

router.get('/user/:userId', authMiddleware, (req, res, next) => {
  predictionController.getUserPredictions(req, res).catch(next);
});

router.get('/match/:matchId/elections', authMiddleware, (req, res, next) => {
  predictionController.getMatchElections(req, res).catch(next);
});

router.get('/match/:matchId', authMiddleware, (req, res, next) => {
  predictionController.getMatchPredictions(req, res).catch(next);
});

router.get('/user/:userId/stats', authMiddleware, (req, res, next) => {
  predictionController.getUserStats(req, res).catch(next);
});

export default router;
