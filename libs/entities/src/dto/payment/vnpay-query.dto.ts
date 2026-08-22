import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VnPayQuerySchema = z
  .object({
    vnp_Amount: z.string().optional(),
    vnp_TxnRef: z.string().optional(),
    vnp_OrderInfo: z.string().optional(),
    vnp_TransactionNo: z.string().optional(),
    vnp_BankCode: z.string().optional(),
    vnp_PayDate: z.string().optional(),
    vnp_ResponseCode: z.string().optional(),
    vnp_SecureHash: z.string().optional(),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean(), z.undefined()]));

export class VnPayQueryDto extends createZodDto(VnPayQuerySchema) {}
