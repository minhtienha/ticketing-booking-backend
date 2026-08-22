import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaymentStatusEventSchema = z.object({
  orderId: z
    .string({ message: 'orderId is required' })
    .uuid('orderId must be a valid UUID'),
});

export class PaymentStatusEventDto extends createZodDto(
  PaymentStatusEventSchema,
) {}
