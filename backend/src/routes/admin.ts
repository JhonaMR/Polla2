import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// Users
router.get('/users', (req, res, next) => {
  adminController.getAllUsers(req, res).catch(next);
});

router.put('/users/:userId', (req, res, next) => {
  adminController.updateUser(req, res).catch(next);
});

// Teams
router.get('/teams', (req, res, next) => {
  adminController.getTeams(req, res).catch(next);
});

router.post('/teams', (req, res, next) => {
  adminController.createTeam(req, res).catch(next);
});

router.delete('/teams/:teamId', (req, res, next) => {
  adminController.deleteTeam(req, res).catch(next);
});

router.put('/teams/:teamId', (req, res, next) => {
  adminController.updateTeam(req, res).catch(next);
});

// Matches
router.post('/matches', (req, res, next) => {
  adminController.createMatch(req, res).catch(next);
});

router.put('/matches/:matchId', (req, res, next) => {
  adminController.updateMatch(req, res).catch(next);
});

router.delete('/matches/:matchId', (req, res, next) => {
  adminController.deleteMatch(req, res).catch(next);
});

router.put('/matches/:matchId/finish', (req, res, next) => {
  adminController.finishMatch(req, res).catch(next);
});

router.put('/matches/:matchId/revert', (req, res, next) => {
  adminController.revertMatch(req, res).catch(next);
});

// Bonus Questions
router.post('/bonus-questions', (req, res, next) => {
  adminController.createBonusQuestion(req, res).catch(next);
});

router.get('/bonus-questions', (req, res, next) => {
  adminController.getBonusQuestions(req, res).catch(next);
});

router.get('/bonus-questions/:questionId/predictions', (req, res, next) => {
  adminController.getBonusQuestionPredictions(req, res).catch(next);
});

router.put('/bonus-questions/:questionId', (req, res, next) => {
  adminController.updateBonusQuestion(req, res).catch(next);
});

router.delete('/bonus-questions/:questionId', (req, res, next) => {
  adminController.deleteBonusQuestion(req, res).catch(next);
});

// Bonus Predictions (admin can edit/delete user answers)
router.put('/bonus-predictions/:predictionId', (req, res, next) => {
  adminController.updateBonusPrediction(req, res).catch(next);
});

router.delete('/bonus-predictions/:predictionId', (req, res, next) => {
  adminController.deleteBonusPrediction(req, res).catch(next);
});

// Scoring
router.post('/calculate-scores', (req, res, next) => {
  adminController.calculateScores(req, res).catch(next);
});

// Dashboard
router.get('/dashboard-stats', (req, res, next) => {
  adminController.getDashboardStats(req, res).catch(next);
});

// Points Config
router.get('/points-config', (req, res, next) => {
  adminController.getPointsConfig(req, res).catch(next);
});

router.put('/points-config', (req, res, next) => {
  adminController.updatePointsConfig(req, res).catch(next);
});

export default router;
