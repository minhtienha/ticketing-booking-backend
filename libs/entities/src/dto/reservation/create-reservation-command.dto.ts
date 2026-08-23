import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateReservationCommandSchema = z.object({
  userId: z
    .string({ message: 'userId is required' })
    .uuid('userId must be a valid UUID'),
  eventId: z
    .string({ message: 'eventId is required' })
    .uuid('eventId must be a valid UUID'),
  ticketTierId: z
    .string({ message: 'ticketTierId is required' })
    .uuid('ticketTierId must be a valid UUID'),
  quantity: z
    .number({ message: 'quantity must be a number' })
    .int('quantity must be an integer')
    .min(1, 'quantity must be at least 1'),
});

export class CreateReservationCommandDto extends createZodDto(
  CreateReservationCommandSchema,
) {}
