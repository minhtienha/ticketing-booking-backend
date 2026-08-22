import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReservationExpiredEventSchema = z.object({
  reservationId: z
    .string({ message: 'reservationId is required' })
    .uuid('reservationId must be a valid UUID'),
});

export class ReservationExpiredEventDto extends createZodDto(
  ReservationExpiredEventSchema,
) {}
