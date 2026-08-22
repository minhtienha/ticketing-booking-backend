import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateEventSchema = z.object({
  name: z
    .string({ message: 'Name must be a string' })
    .trim()
    .min(1, 'Tên sự kiện không được để trống')
    .optional(),
  description: z
    .string({ message: 'Description must be a string' })
    .trim()
    .optional()
    .or(z.literal('')),
  startTime: z.coerce
    .date({ message: 'startTime must be a valid date' })
    .optional(),
  endTime: z.coerce
    .date({ message: 'endTime must be a valid date' })
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
});

export class UpdateEventDto extends createZodDto(UpdateEventSchema) {}
