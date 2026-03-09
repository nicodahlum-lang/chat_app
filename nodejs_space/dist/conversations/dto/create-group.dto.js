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
exports.CreateGroupDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateGroupDto {
    name;
    participantIds;
    avatarUrl;
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My Awesome Group' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['user-uuid-1', 'user-uuid-2'], type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateGroupDto.prototype, "participantIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://www.shutterstock.com/image-vector/large-set-flat-design-user-600nw-2719314407.jpg', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "avatarUrl", void 0);
//# sourceMappingURL=create-group.dto.js.map