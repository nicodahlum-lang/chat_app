import { IsNotEmpty, IsString, IsArray, ArrayMinSize, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'My Awesome Group' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['user-uuid-1', 'user-uuid-2'], type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  participantIds: string[];

  @ApiProperty({ example: 'https://www.shutterstock.com/image-vector/large-set-flat-design-user-600nw-2719314407.jpg', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
