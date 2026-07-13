import { PipeTransform, BadRequestException } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Validates a payload against a Zod schema before it reaches a controller.
 * Every external input crosses one of these — the API never trusts a raw body
 * or query. On failure it returns 400 with the field errors, never a stack.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    return result.data;
  }
}
