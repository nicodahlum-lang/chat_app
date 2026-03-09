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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["AUDIO"] = "AUDIO";
})(MessageType || (MessageType = {}));
class SendMessageDto {
    content;
    messageType;
    imageUrl;
    audioUrl;
    isDisappearing;
    disappearDurationSeconds;
    replyToId;
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hello, how are you?', required: false }),
    (0, class_validator_1.ValidateIf)((o) => o.messageType === 'TEXT'),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TEXT', enum: ['TEXT', 'IMAGE', 'AUDIO'] }),
    (0, class_validator_1.IsEnum)(MessageType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "messageType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://example.com/image.png', required: false }),
    (0, class_validator_1.ValidateIf)((o) => o.messageType === 'IMAGE'),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/uploads/audio.m4a', required: false }),
    (0, class_validator_1.ValidateIf)((o) => o.messageType === 'AUDIO'),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "audioUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SendMessageDto.prototype, "isDisappearing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SendMessageDto.prototype, "disappearDurationSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'msg-uuid-123', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "replyToId", void 0);
//# sourceMappingURL=send-message.dto.js.map