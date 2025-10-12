import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        // If data already has the standard format, return as is
        if (data && typeof data === 'object' && 'success' in data && 'statusCode' in data) {
          return data;
        }

        // Check if data has pagination metadata
        const hasPagination = data && typeof data === 'object' &&
          'data' in data && 'total' in data && 'page' in data;

        // Transform to standard format
        const response: any = {
          success: true,
          statusCode,
          message: data?.message || 'Success',
          data: data?.data !== undefined ? data.data : data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        // Preserve pagination metadata if present
        if (hasPagination) {
          response.meta = {
            total: data.total,
            page: data.page,
            limit: data.limit,
            totalPages: data.totalPages,
          };
        }

        return response;
      }),
    );
  }
}
