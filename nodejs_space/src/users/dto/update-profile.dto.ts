import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe Updated', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'https://upload.wikimedia.org/wikipedia/commons/6/67/User_Avatar.png', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
