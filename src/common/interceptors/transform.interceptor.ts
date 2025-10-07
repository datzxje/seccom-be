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

        // Transform to standard format
        return {
          success: true,
          statusCode,
          message: data?.message || 'Success',
          data: data?.data !== undefined ? data.data : data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
