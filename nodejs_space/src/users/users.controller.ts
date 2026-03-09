import { Controller, Get, Put, Query, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiQuery({ name: 'query', required: true, description: 'Search term' })
  @ApiResponse({ status: 200, description: 'Users found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchUsers(@Query('query') query: string, @Request() req: any) {
    return this.usersService.searchUsers(query, req.user.userId);
  }

  @Get('online')
  @ApiOperation({ summary: 'Get list of currently online users' })
  @ApiResponse({ status: 200, description: 'Online users retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOnlineUsers() {
    return this.usersService.getOnlineUsers();
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() req: any) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Put('push-token')
  @ApiOperation({ summary: 'Update push notification token' })
  @ApiResponse({ status: 200, description: 'Push token updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePushToken(@Body('token') token: string, @Request() req: any) {
    return this.usersService.updatePushToken(req.user.userId, token);
  }

  @Put('public-key')
  @ApiOperation({ summary: 'Update E2E public key' })
  @ApiResponse({ status: 200, description: 'Public key updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePublicKey(@Body('publicKey') publicKey: string, @Request() req: any) {
    return this.usersService.updatePublicKey(req.user.userId, publicKey);
  }

  @Get(':id/public-key')
  @ApiOperation({ summary: 'Get a user\'s public key' })
  @ApiResponse({ status: 200, description: 'Public key retrieved' })
  async getPublicKey(@Param('id') id: string) {
    return this.usersService.getPublicKey(id);
  }

  @Put('background')
  @ApiOperation({ summary: 'Update chat theme background' })
  @ApiResponse({ status: 200, description: 'Background updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBackground(@Body('backgroundUrl') backgroundUrl: string | null, @Request() req: any) {
    return this.usersService.updateBackground(req.user.userId, backgroundUrl);
  }
}
