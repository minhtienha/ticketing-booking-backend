import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateTicketTierSchema = z.object({
  eventId: z
    .string({ message: 'eventId must be a string' })
    .uuid('eventId must be a valid UUID')
    .optional(),
  name: z
    .string({ message: 'name must be a string' })
    .trim()
    .min(1, 'Tên hạng vé không được để trống')
    .optional(),
  price: z
    .number({ message: 'price must be a number' })
    .min(0, 'Giá không được âm')
    .optional(),
  totalQuantity: z
    .number({ message: 'totalQuantity must be a number' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng phải lớn hơn 0')
    .optional(),
});

export class UpdateTicketTierDto extends createZodDto(UpdateTicketTierSchema) {}
