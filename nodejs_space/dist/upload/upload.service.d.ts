export declare class UploadService {
    private readonly logger;
    private readonly uploadDir;
    constructor();
    uploadImage(file: Express.Multer.File): Promise<string>;
    uploadAudio(file: Express.Multer.File): Promise<string>;
    private saveFile;
}
