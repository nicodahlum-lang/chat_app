import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional, IsInt, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
}

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, how are you?', required: false })
  @ValidateIf((o) => o.messageType === 'TEXT')
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiProperty({ example: 'TEXT', enum: ['TEXT', 'IMAGE', 'AUDIO'] })
  @IsEnum(MessageType)
  @IsNotEmpty()
  messageType: 'TEXT' | 'IMAGE' | 'AUDIO';

  @ApiProperty({ example: 'https://example.com/image.png', required: false })
  @ValidateIf((o) => o.messageType === 'IMAGE')
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;

  @ApiProperty({ example: '/uploads/audio.m4a', required: false })
  @ValidateIf((o) => o.messageType === 'AUDIO')
  @IsString()
  @IsNotEmpty()
  audioUrl?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDisappearing?: boolean;

  @ApiProperty({ example: 10, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  disappearDurationSeconds?: number;

  @ApiProperty({ example: 'msg-uuid-123', required: false })
  @IsString()
  @IsOptional()
  replyToId?: string;
}
