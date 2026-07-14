import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { reportsQuerySchema, type ReportsQuery } from "@gin/contracts";

import { ReportsService } from "./reports.service.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth/guards.js";

@Controller("admin/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  get(@Query(new ZodValidationPipe(reportsQuerySchema)) query: ReportsQuery) {
    return this.reports.getReports(query.period);
  }
}
