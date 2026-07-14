import { Module } from "@nestjs/common";

import { ImagesService } from "./images.service.js";
import { ImagesController } from "./images.controller.js";

@Module({
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
