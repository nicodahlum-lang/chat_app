"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let UploadService = UploadService_1 = class UploadService {
    logger = new common_1.Logger(UploadService_1.name);
    uploadDir = path.join(process.cwd(), 'uploads');
    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async uploadImage(file) {
        try {
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new common_1.BadRequestException('Invalid file type. Only images are allowed.');
            }
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new common_1.BadRequestException('File size exceeds 10MB limit');
            }
            return this.saveFile(file);
        }
        catch (error) {
            this.logger.error('Upload image error', error);
            throw error;
        }
    }
    async uploadAudio(file) {
        try {
            const allowedMimeTypes = [
                'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/mp3',
                'audio/webm', 'audio/wav', 'audio/ogg', 'audio/aac',
                'audio/x-m4a', 'audio/x-wav',
            ];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new common_1.BadRequestException(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`);
            }
            const maxSize = 25 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new common_1.BadRequestException('File size exceeds 25MB limit');
            }
            return this.saveFile(file);
        }
        catch (error) {
            this.logger.error('Upload audio error', error);
            throw error;
        }
    }
    saveFile(file) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.originalname) || '.m4a';
        const filename = `${timestamp}-${randomString}${ext}`;
        const filePath = path.join(this.uploadDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        const url = `/uploads/${filename}`;
        this.logger.log(`File uploaded: ${filename}`);
        return url;
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadService);
//# sourceMappingURL=upload.service.js.map