import { Reflector } from '@nestjs/core';
import { UserRole } from '@ticketing/entities';

export const Roles = Reflector.createDecorator<UserRole[]>();
