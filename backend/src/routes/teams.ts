import { Router } from 'express';
import { teamController } from '../controllers/teamController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res, next) => {
  teamController.getTeams(req as any, res).catch(next);
});

router.get('/:id', authMiddleware, (req, res, next) => {
  teamController.getTeam(req as any, res).catch(next);
});

router.get('/region/:region', authMiddleware, (req, res, next) => {
  teamController.getTeamsByRegion(req as any, res).catch(next);
});

router.get('/group/:group', authMiddleware, (req, res, next) => {
  teamController.getTeamsByGroup(req as any, res).catch(next);
});

export default router;
