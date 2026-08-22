import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReservationEventSchema = z.object({
  reservationId: z
    .string({ message: 'reservationId is required' })
    .uuid('reservationId must be a valid UUID'),
});

export class ReservationEventDto extends createZodDto(ReservationEventSchema) {}
