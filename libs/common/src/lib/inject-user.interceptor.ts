import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InjectUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const userId = req.user?._id;

    if (userId && req.body) {
      if (req.method === 'POST') {
        req.body.createdBy = userId;
        req.body.updatedBy = userId;
      } else if (req.method === 'PATCH' || req.method === 'PUT') {
        req.body.updatedBy = userId;
      }
    }

    return next.handle();
  }
}
