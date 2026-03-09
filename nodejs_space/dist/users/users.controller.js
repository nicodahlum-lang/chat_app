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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async searchUsers(query, req) {
        return this.usersService.searchUsers(query, req.user.userId);
    }
    async getOnlineUsers() {
        return this.usersService.getOnlineUsers();
    }
    async updateProfile(updateProfileDto, req) {
        return this.usersService.updateProfile(req.user.userId, updateProfileDto);
    }
    async updatePushToken(token, req) {
        return this.usersService.updatePushToken(req.user.userId, token);
    }
    async updatePublicKey(publicKey, req) {
        return this.usersService.updatePublicKey(req.user.userId, publicKey);
    }
    async getPublicKey(id) {
        return this.usersService.getPublicKey(id);
    }
    async updateBackground(backgroundUrl, req) {
        return this.usersService.updateBackground(req.user.userId, backgroundUrl);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search users by name or email' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: true, description: 'Search term' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('online'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of currently online users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Online users retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getOnlineUsers", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - validation errors' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('push-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update push notification token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Push token updated' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)('token')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePushToken", null);
__decorate([
    (0, common_1.Put)('public-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Update E2E public key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Public key updated' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)('publicKey')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePublicKey", null);
__decorate([
    (0, common_1.Get)(':id/public-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a user\'s public key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Public key retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPublicKey", null);
__decorate([
    (0, common_1.Put)('background'),
    (0, swagger_1.ApiOperation)({ summary: 'Update chat theme background' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Background updated' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)('backgroundUrl')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateBackground", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map