import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.message.includes('SQLITE_CONSTRAINT')) {
    res.status(409).json({
      success: false,
      error: 'Constraint violation: ' + err.message,
    });
    return;
  }

  // Multer errors
  if (err.message === 'File too large') {
    res.status(413).json({
      success: false,
      error: 'File size exceeds the 50MB limit',
    });
    return;
  }

  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
}
