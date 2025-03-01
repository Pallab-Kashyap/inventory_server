import { Request, Response, NextFunction } from 'express';

class APIError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static custom(statusCode: number, message: string) {
    return new APIError(statusCode, message);
  }
}

const errorHandler = (err: APIError | Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err); // Log error

  const statusCode = err instanceof APIError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
