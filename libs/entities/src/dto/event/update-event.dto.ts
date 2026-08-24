import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateEventDto {
  @ApiPropertyOptional({
    description: 'Tên sự kiện',
    example: 'Music Concert 2026',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết về sự kiện',
    example: 'Đêm nhạc acoustic mùa thu',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Thời gian bắt đầu (ISO 8601 string)',
    example: '2026-08-24T19:00:00.000Z',
  })
  startTime?: string | Date;

  @ApiPropertyOptional({
    description: 'Thời gian kết thúc (ISO 8601 string)',
    example: '2026-08-24T22:00:00.000Z',
  })
  endTime?: string | Date;

  @ApiPropertyOptional({
    description: 'Trạng thái của sự kiện',
    enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
    example: 'PUBLISHED',
  })
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
}
