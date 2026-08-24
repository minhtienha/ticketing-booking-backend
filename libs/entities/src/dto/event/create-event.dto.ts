import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateEventSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(1, 'Tên sự kiện không được để trống'),
  description: z
    .string({ message: 'Description must be a string' })
    .trim()
    .optional()
    .or(z.literal('')),
  startTime: z.coerce.date({ message: 'startTime must be a valid date' }),
  endTime: z.coerce.date({ message: 'endTime must be a valid date' }),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
});

export class CreateEventDto {
  @ApiProperty({ example: 'Music Concert 2026' })
  name!: string;

  @ApiProperty({ example: '2026-08-24T20:00:00.000Z' })
  startDate!: string;

  @ApiProperty({ example: '2026-08-24T23:00:00.000Z' })
  endDate!: string;
}
