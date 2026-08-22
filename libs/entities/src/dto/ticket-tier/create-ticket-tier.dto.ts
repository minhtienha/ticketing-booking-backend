import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTicketTierSchema = z.object({
  eventId: z
    .string({ message: 'eventId is required' })
    .uuid('eventId must be a valid UUID'),
  name: z
    .string({ message: 'name is required' })
    .trim()
    .min(1, 'Tên hạng vé không được để trống'),
  price: z
    .number({ message: 'price must be a number' })
    .min(0, 'Giá không được âm'),
  totalQuantity: z
    .number({ message: 'totalQuantity must be a number' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng phải lớn hơn 0'),
});

export class CreateTicketTierDto extends createZodDto(CreateTicketTierSchema) {}
