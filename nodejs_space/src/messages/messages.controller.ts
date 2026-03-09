import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Messages')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for a conversation (paginated)' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of messages to fetch', type: Number })
  @ApiQuery({ name: 'before', required: false, description: 'Message ID to fetch messages before' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Request() req?: any,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.getMessages(conversationId, req.user.userId, limitNum, before);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send a new message' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    return this.messagesService.sendMessage(conversationId, req.user.userId, sendMessageDto);
  }

  @Post('messages/:messageId/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a message as viewed (for disappearing messages)' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message marked as viewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async viewMessage(@Param('messageId') messageId: string, @Request() req: any) {
    return this.messagesService.viewMessage(messageId, req.user.userId);
  }

  @Put('conversations/:conversationId/read')
  @ApiOperation({ summary: 'Mark conversation as read (update lastReadAt)' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  async markConversationAsRead(@Param('conversationId') conversationId: string, @Request() req: any) {
    return this.messagesService.markConversationAsRead(conversationId, req.user.userId);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the sender' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(@Param('messageId') messageId: string, @Request() req: any) {
    return this.messagesService.deleteMessage(messageId, req.user.userId);
  }

  @Post(':messageId/react')
  @ApiOperation({ summary: 'React to a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Reaction added or removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async reactToMessage(
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
    @Request() req: any,
  ) {
    return this.messagesService.reactToMessage(messageId, req.user.userId, emoji);
  }
}
