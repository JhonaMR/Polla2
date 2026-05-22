import { Router } from 'express';
import { bonusController } from '../controllers/bonusController.js';
import { adminController } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res, next) => {
  bonusController.getQuestions(req as any, res).catch(next);
});

router.get('/points/config', authMiddleware, (req, res, next) => {
  adminController.getPointsConfig(req as any, res).catch(next);
});

router.get('/:id', authMiddleware, (req, res, next) => {
  bonusController.getQuestion(req as any, res).catch(next);
});

router.post('/predictions', authMiddleware, (req, res, next) => {
  bonusController.createPrediction(req as any, res).catch(next);
});

router.get('/user/:userId', authMiddleware, (req, res, next) => {
  bonusController.getUserPredictions(req as any, res).catch(next);
});

router.get('/:id/predictions', authMiddleware, (req, res, next) => {
  bonusController.getQuestionPredictions(req as any, res).catch(next);
});

export default router;
