import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Express } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Only images are allowed.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new BadRequestException('File size exceeds 10MB limit');
      }

      return this.saveFile(file);
    } catch (error) {
      this.logger.error('Upload image error', error);
      throw error;
    }
  }

  async uploadAudio(file: Express.Multer.File): Promise<string> {
    try {
      // Validate file type
      const allowedMimeTypes = [
        'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/mp3',
        'audio/webm', 'audio/wav', 'audio/ogg', 'audio/aac',
        'audio/x-m4a', 'audio/x-wav',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`);
      }

      // Validate file size (max 25MB)
      const maxSize = 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException('File size exceeds 25MB limit');
      }

      return this.saveFile(file);
    } catch (error) {
      this.logger.error('Upload audio error', error);
      throw error;
    }
  }

  private saveFile(file: Express.Multer.File): string {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname) || '.m4a';
    const filename = `${timestamp}-${randomString}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return URL
    const url = `/uploads/${filename}`;
    this.logger.log(`File uploaded: ${filename}`);
    return url;
  }
}
