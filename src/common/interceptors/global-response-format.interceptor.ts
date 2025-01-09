import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { STATUS_CODES } from 'src/common/constant/status-codes.constant';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => ({
        statusCode: STATUS_CODES.SUCCESS,
        timestamp: new Date().toISOString(),
        path: request.url,
        result: data || { message: 'Operation Success' }
      }))
    );
  }
}
