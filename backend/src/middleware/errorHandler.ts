import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/validators.js';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substring(7);

  console.error(`[ERROR-${errorId}] ${timestamp}`, {
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    body: req.body,
    stack: err.stack,
  });

  if (err instanceof ValidationError) {
    console.warn(`[VALIDATION-${errorId}] Validation failed:`, err.messages);
    return res.status(400).json({
      error: 'Validation error',
      messages: err.messages,
      errorId,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    errorId,
    ...(process.env.NODE_ENV === 'development' && { details: err.details }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  console.warn(`[NOT-FOUND] ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}

export class AppError extends Error implements ApiError {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}
