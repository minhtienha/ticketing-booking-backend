import { CreateUserDto, User } from '@ticketing/entities';
import { Observable } from 'rxjs';

export interface UsersService {
  CreateUser(data: CreateUserDto): Observable<User>;
}
