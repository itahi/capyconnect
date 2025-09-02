import sharp from "sharp";
import { Buffer } from "buffer";

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "png" | "jpeg" | "webp";
}

export class ImageProcessor {
  private static readonly DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 85,
    format: "png",
  };

  /**
   * Process an image buffer with automatic resizing and format conversion
   */
  static async processImage(
    imageBuffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<Buffer> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    let sharpInstance = sharp(imageBuffer);

    // Get image metadata to check original dimensions
    const metadata = await sharpInstance.metadata();
    
    // Only resize if the image is larger than max dimensions
    if (
      metadata.width && metadata.height &&
      (metadata.width > opts.maxWidth || metadata.height > opts.maxHeight)
    ) {
      sharpInstance = sharpInstance.resize(opts.maxWidth, opts.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to specified format with quality settings
    switch (opts.format) {
      case "png":
        sharpInstance = sharpInstance.png({
          quality: opts.quality,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;
      case "jpeg":
        sharpInstance = sharpInstance.jpeg({
          quality: opts.quality,
          progressive: true,
        });
        break;
      case "webp":
        sharpInstance = sharpInstance.webp({
          quality: opts.quality,
        });
        break;
    }

    return await sharpInstance.toBuffer();
  }

  /**
   * Standardize image for marketplace listings with consistent format
   */
  static async standardizeForMarketplace(
    imageBuffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<Buffer> {
    const opts = { 
      maxWidth: 800, 
      maxHeight: 600, 
      quality: 85, 
      format: "jpeg" as const,
      ...options 
    };

    return sharp(imageBuffer)
      .resize(opts.maxWidth, opts.maxHeight, {
        fit: "cover",
        position: "center",
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten() // Remove transparency
      .jpeg({ 
        quality: opts.quality,
        progressive: true
      })
      .toBuffer();
  }

  /**
   * Create multiple sizes for responsive images
   */
  static async createMultipleSizes(
    imageBuffer: Buffer,
    sizes: { width: number; height: number; suffix: string }[] = [
      { width: 400, height: 300, suffix: "thumb" },
      { width: 800, height: 600, suffix: "medium" },
      { width: 1200, height: 800, suffix: "large" },
    ]
  ): Promise<{ [key: string]: Buffer }> {
    const results: { [key: string]: Buffer } = {};

    for (const size of sizes) {
      const processed = await sharp(imageBuffer)
        .resize(size.width, size.height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({
          quality: 85,
          compressionLevel: 9,
        })
        .toBuffer();

      results[size.suffix] = processed;
    }

    return results;
  }

  /**
   * Validate if the buffer is a valid image
   */
  static async validateImage(imageBuffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(imageBuffer: Buffer) {
    return await sharp(imageBuffer).metadata();
  }
}