import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { prisma } from "@gin/db";

// Images are stored as bytes in Postgres — chosen for this project's scale: no
// bucket or volume to provision, and images travel with the database. The
// tradeoff (a real production concern, not one this project needs to solve
// today): large binary rows bloat the database and its backups, and nothing
// here fronts these bytes with a CDN. If the catalog or its traffic grows
// significantly, move to object storage (S3/R2) and keep this same interface —
// callers only depend on `{ id, url }` and `getById`.

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

@Injectable()
export class ImagesService {
  async upload(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }): Promise<{ id: string; url: string }> {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        "Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("Image must be 5 MB or smaller.");
    }

    const image = await prisma.image.create({
      data: {
        // Prisma 7's Bytes field wants a plain Uint8Array<ArrayBuffer>, not the
        // Node Buffer subtype multer hands back — same bytes, stricter type.
        data: new Uint8Array(file.buffer),
        mimeType: file.mimetype,
        filename: file.originalname.slice(0, 200),
      },
      select: { id: true },
    });

    return { id: image.id, url: `/images/${image.id}` };
  }

  async getById(id: string): Promise<{ data: Buffer; mimeType: string }> {
    const image = await prisma.image.findUnique({
      where: { id },
      select: { data: true, mimeType: true },
    });
    if (!image) throw new NotFoundException("Image not found");
    return { data: Buffer.from(image.data), mimeType: image.mimeType };
  }
}
