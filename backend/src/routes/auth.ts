import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', authLimiter, (req, res, next) => {
  authController.register(req, res).catch(next);
});

router.post('/login', authLimiter, (req, res, next) => {
  authController.login(req, res).catch(next);
});

router.post('/refresh', (req, res, next) => {
  authController.refresh(req, res).catch(next);
});

router.post('/logout', (req, res, next) => {
  authController.logout(req, res).catch(next);
});

router.get('/verify', authMiddleware, (req, res, next) => {
  authController.verify(req, res).catch(next);
});

export default router;
