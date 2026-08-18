import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface PgError {
  code?: string;
  constraint?: string;
  detail?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${JSON.stringify(body)}`,
      );
      return response.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, timestamp: new Date().toISOString(), path: request.url, message: body }
          : { ...body, timestamp: new Date().toISOString(), path: request.url },
      );
    }

    const pgError = exception as PgError;
    if (pgError?.code === '23505') {
      const message = pgError.constraint
        ? `Ya existe un registro con ese valor (${pgError.constraint})`
        : 'Ya existe un registro con ese valor';
      this.logger.error(`${request.method} ${request.url} -> 409 ${message}`);
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    }

    if (pgError?.code === '23503') {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'El registro está siendo usado por otra entidad',
      });
    }

    this.logger.error(
      `${request.method} ${request.url} -> 500`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Error interno del servidor',
    });
  }
}