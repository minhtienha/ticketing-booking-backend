import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
});

export class ListEventsQueryDto extends createZodDto(ListEventsQuerySchema) {}
