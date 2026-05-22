import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { authService } from '../services/authService.js';
import { validate, schemas } from '../utils/validators.js';

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const data = validate(schemas.register, req.body);
      const result = await authService.register(data.username, data.displayName, data.password);

      res.status(201).json({
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const data = validate(schemas.login, req.body);
      const result = await authService.login(data.username, data.password);

      res.status(200).json({
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  async refresh(req: AuthRequest, res: Response) {
    try {
      const data = validate(schemas.refreshToken, req.body);
      const result = await authService.refreshAccessToken(data.refreshToken);

      res.status(200).json({
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      const data = validate(schemas.refreshToken, req.body);
      await authService.logout(data.refreshToken);

      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      throw error;
    }
  }

  async verify(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      res.status(200).json({
        message: 'Token is valid',
        data: req.user,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const authController = new AuthController();
