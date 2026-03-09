import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateOneOnOneDto } from './dto/create-one-on-one.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllConversations(@Request() req: any) {
    return this.conversationsService.getAllConversations(req.user.userId);
  }

  @Post('one-on-one')
  @ApiOperation({ summary: 'Create or get existing one-on-one conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  @ApiResponse({ status: 200, description: 'Existing conversation returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async createOneOnOne(@Body() createOneOnOneDto: CreateOneOnOneDto, @Request() req: any) {
    return this.conversationsService.createOneOnOne(req.user.userId, createOneOnOneDto);
  }

  @Post('group')
  @ApiOperation({ summary: 'Create new group chat' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  async createGroup(@Body() createGroupDto: CreateGroupDto, @Request() req: any) {
    return this.conversationsService.createGroup(req.user.userId, createGroupDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationDetails(@Param('id') id: string, @Request() req: any) {
    return this.conversationsService.getConversationDetails(id, req.user.userId);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participants to group chat' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Participants added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a group or not a member' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async addParticipants(
    @Param('id') id: string,
    @Body() addParticipantsDto: AddParticipantsDto,
    @Request() req: any,
  ) {
    return this.conversationsService.addParticipants(id, req.user.userId, addParticipantsDto);
  }
}
