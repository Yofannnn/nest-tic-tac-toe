import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError, HttpException)
export class ErrorFilter implements ExceptionFilter {
  catch(exception: ZodError | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({ statusCode: status, error: exception.getResponse() });
    }

    if (exception instanceof ZodError) {
      response.status(400).json({ statusCode: 400, error: exception.errors || 'Invalid request' });
    }

    response.status(500).json({ statusCode: 500, error: exception.message || 'Internal server error' });
  }
}
