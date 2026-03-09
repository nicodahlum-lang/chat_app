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
exports.ConversationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const conversations_service_1 = require("./conversations.service");
const create_one_on_one_dto_1 = require("./dto/create-one-on-one.dto");
const create_group_dto_1 = require("./dto/create-group.dto");
const add_participants_dto_1 = require("./dto/add-participants.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ConversationsController = class ConversationsController {
    conversationsService;
    constructor(conversationsService) {
        this.conversationsService = conversationsService;
    }
    async getAllConversations(req) {
        return this.conversationsService.getAllConversations(req.user.userId);
    }
    async createOneOnOne(createOneOnOneDto, req) {
        return this.conversationsService.createOneOnOne(req.user.userId, createOneOnOneDto);
    }
    async createGroup(createGroupDto, req) {
        return this.conversationsService.createGroup(req.user.userId, createGroupDto);
    }
    async getConversationDetails(id, req) {
        return this.conversationsService.getConversationDetails(id, req.user.userId);
    }
    async addParticipants(id, addParticipantsDto, req) {
        return this.conversationsService.addParticipants(id, req.user.userId, addParticipantsDto);
    }
};
exports.ConversationsController = ConversationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all conversations for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversations retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "getAllConversations", null);
__decorate([
    (0, common_1.Post)('one-on-one'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or get existing one-on-one conversation' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Conversation created' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Existing conversation returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Participant not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_one_on_one_dto_1.CreateOneOnOneDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "createOneOnOne", null);
__decorate([
    (0, common_1.Post)('group'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new group chat' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Group created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation errors' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_group_dto_1.CreateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get conversation details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Conversation ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation details retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not a participant' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conversation not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "getConversationDetails", null);
__decorate([
    (0, common_1.Post)(':id/participants'),
    (0, swagger_1.ApiOperation)({ summary: 'Add participants to group chat' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Conversation ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Participants added successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not a group or not a member' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conversation not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_participants_dto_1.AddParticipantsDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationsController.prototype, "addParticipants", null);
exports.ConversationsController = ConversationsController = __decorate([
    (0, swagger_1.ApiTags)('Conversations'),
    (0, common_1.Controller)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService])
], ConversationsController);
//# sourceMappingURL=conversations.controller.js.map