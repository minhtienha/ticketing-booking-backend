import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePaymentIntentSchema = z.object({
  orderId: z
    .string({ message: 'orderId is required' })
    .uuid('orderId must be a valid UUID'),
  amount: z
    .number({ message: 'amount must be a number' })
    .min(0, 'amount must be non-negative'),
  idempotencyKey: z
    .string({ message: 'idempotencyKey is required' })
    .min(1, 'idempotencyKey is required'),
});

export class CreatePaymentIntentDto extends createZodDto(
  CreatePaymentIntentSchema,
) {}
