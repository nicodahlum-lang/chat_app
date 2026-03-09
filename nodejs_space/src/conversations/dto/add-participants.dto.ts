import { IsNotEmpty, IsArray, ArrayMinSize, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddParticipantsDto {
  @ApiProperty({ example: ['user-uuid-1', 'user-uuid-2'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];
}
