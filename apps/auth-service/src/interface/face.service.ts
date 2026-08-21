import { User } from '@ticketing/entities';
import { Observable } from 'rxjs';

export interface UsersService {
  CreateUser(data: { email: string; password: string }): Observable<User>;
}
