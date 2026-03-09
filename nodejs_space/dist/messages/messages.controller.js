"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const messages_service_1 = require("./messages.service");
const send_message_dto_1 = require("./dto/send-message.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MessagesController = class MessagesController {
    messagesService;
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    async getMessages(conversationId, limit, before, req) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.messagesService.getMessages(conversationId, req.user.userId, limitNum, before);
    }
    async sendMessage(conversationId, sendMessageDto, req) {
        return this.messagesService.sendMessage(conversationId, req.user.userId, sendMessageDto);
    }
    async viewMessage(messageId, req) {
        return this.messagesService.viewMessage(messageId, req.user.userId);
    }
    async markConversationAsRead(conversationId, req) {
        return this.messagesService.markConversationAsRead(conversationId, req.user.userId);
    }
    async deleteMessage(messageId, req) {
        return this.messagesService.deleteMessage(messageId, req.user.userId);
    }
    async reactToMessage(messageId, emoji, req) {
        return this.messagesService.reactToMessage(messageId, req.user.userId, emoji);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)('conversations/:conversationId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages for a conversation (paginated)' }),
    (0, swagger_1.ApiParam)({ name: 'conversationId', description: 'Conversation ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of messages to fetch', type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'before', required: false, description: 'Message ID to fetch messages before' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Messages retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not a participant' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conversation not found' }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('before')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a new message' }),
    (0, swagger_1.ApiParam)({ name: 'conversationId', description: 'Conversation ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not a participant' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation errors' }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_message_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('messages/:messageId/view'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a message as viewed (for disappearing messages)' }),
    (0, swagger_1.ApiParam)({ name: 'messageId', description: 'Message ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message marked as viewed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "viewMessage", null);
__decorate([
    (0, common_1.Put)('conversations/:conversationId/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark conversation as read (update lastReadAt)' }),
    (0, swagger_1.ApiParam)({ name: 'conversationId', description: 'Conversation ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation marked as read' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not a participant' }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "markConversationAsRead", null);
__decorate([
    (0, common_1.Delete)(':messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a message' }),
    (0, swagger_1.ApiParam)({ name: 'messageId', description: 'Message ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not the sender' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Post)(':messageId/react'),
    (0, swagger_1.ApiOperation)({ summary: 'React to a message' }),
    (0, swagger_1.ApiParam)({ name: 'messageId', description: 'Message ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reaction added or removed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Body)('emoji')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "reactToMessage", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('Messages'),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map