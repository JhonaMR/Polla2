import { Router } from 'express';
import { phaseController } from '../controllers/phaseController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Publicly available to authenticated users to know phase states
router.get('/', authMiddleware, (req, res, next) => {
  phaseController.getPhases(req, res).catch(next);
});

// Admin-only routes
router.put('/:phase', authMiddleware, adminMiddleware, (req, res, next) => {
  phaseController.updatePhaseStatus(req, res).catch(next);
});

router.post('/process-groups', authMiddleware, adminMiddleware, (req, res, next) => {
  phaseController.processGroupClassification(req, res).catch(next);
});

export default router;
