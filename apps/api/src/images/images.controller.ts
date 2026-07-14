import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

import { ImagesService } from "./images.service.js";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth/guards.js";

@Controller()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  // Admin-only: uploading is a write. Serving (below) is public — an <img> tag
  // on the storefront cannot attach a bearer token.
  @Post("admin/images")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded.");
    return this.images.upload(file);
  }

  @Get("images/:id")
  async serve(@Param("id") id: string, @Res() res: Response) {
    const image = await this.images.getById(id);
    res.setHeader("Content-Type", image.mimeType);
    // Uploaded images are immutable (a new upload gets a new id), so this is
    // safe to cache hard.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(image.data);
  }
}
