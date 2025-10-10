import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'questions',
  ): Promise<string> {
    try {
      // Convert buffer to stream
      const stream = Readable.from(file.buffer);

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `seccom/${folder}`,
            resource_type: 'auto',
            public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        stream.pipe(uploadStream);
      });

      this.logger.log(`File uploaded successfully: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      const publicId = this.extractPublicIdFromUrl(fileUrl);

      if (!publicId) {
        throw new Error('Invalid Cloudinary URL');
      }

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        this.logger.log(`File deleted successfully: ${publicId}`);
      } else {
        this.logger.warn(`File deletion result: ${result.result} for ${publicId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * Example: https://res.cloudinary.com/demo/image/upload/v1234567/seccom/questions/file.jpg
   * Returns: seccom/questions/file
   */
  private extractPublicIdFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');

      // Find the index of 'upload' in the path
      const uploadIndex = pathParts.findIndex((part) => part === 'upload');

      if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL format');
      }

      // Get everything after 'upload' and the version (v123456789)
      // Skip 'upload' and version, then join the rest
      const publicIdParts = pathParts.slice(uploadIndex + 2);

      // Remove file extension from the last part
      const lastPart = publicIdParts[publicIdParts.length - 1];
      publicIdParts[publicIdParts.length - 1] = lastPart.replace(/\.[^/.]+$/, '');

      return publicIdParts.join('/');
    } catch (error) {
      this.logger.error(`Failed to extract public_id from URL: ${fileUrl}`);
      return '';
    }
  }
}
