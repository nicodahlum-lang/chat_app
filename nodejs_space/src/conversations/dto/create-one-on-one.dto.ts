import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOneOnOneDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsString()
  @IsNotEmpty()
  participantId: string;
}
