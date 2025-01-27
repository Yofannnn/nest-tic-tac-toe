import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ZodError } from 'zod';

@Catch(ZodError, HttpException)
export class ErrorFilter implements ExceptionFilter {
  catch(exception: ZodError | HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({ error: exception.getResponse() });
    }

    if (exception instanceof ZodError) {
      response.status(400).json({ error: exception.errors || 'Invalid request' });
    }

    response.status(500).json({ error: exception.message || 'Internal server error' });
  }
}
