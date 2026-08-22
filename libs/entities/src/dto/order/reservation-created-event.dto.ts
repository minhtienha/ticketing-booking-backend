import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReservationCreatedEventSchema = z.object({
  userId: z
    .string({ message: 'userId is required' })
    .uuid('userId must be a valid UUID'),
  reservationId: z
    .string({ message: 'reservationId is required' })
    .uuid('reservationId must be a valid UUID'),
  totalAmount: z
    .number({ message: 'totalAmount must be a number' })
    .min(0, 'totalAmount must be non-negative'),
  idempotencyKey: z
    .string({ message: 'idempotencyKey is required' })
    .min(1, 'idempotencyKey is required'),
  ticketTierId: z
    .string({ message: 'ticketTierId is required' })
    .uuid('ticketTierId must be a valid UUID'),
  quantity: z
    .number({ message: 'quantity must be a number' })
    .int('quantity must be an integer')
    .min(1, 'quantity must be at least 1'),
  unitPrice: z
    .number({ message: 'unitPrice must be a number' })
    .min(0, 'unitPrice must be non-negative'),
  totalPrice: z
    .number({ message: 'totalPrice must be a number' })
    .min(0, 'totalPrice must be non-negative'),
});

export class ReservationCreatedEventDto extends createZodDto(
  ReservationCreatedEventSchema,
) {}
