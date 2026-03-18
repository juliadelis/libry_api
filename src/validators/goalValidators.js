import { z } from "zod";

const yearSchema = z
  .number("year must be a number")
  .int("year must be an integer")
  .min(1900)
  .max(2200)
  .optional();

const addBookToGoalSchema = z.object({
  bookId: z.string().uuid(),
  year: z.coerce
    .number("year must be a number")
    .int("year must be an integer")
    .min(1900)
    .max(2200)
    .optional(),
});

const setYearTargetSchema = z.object({
  year: z.coerce
    .number("year must be a number")
    .int("year must be an integer")
    .min(1900)
    .max(2200)
    .optional(),
  targetCount: z.coerce
    .number("targetCount must be a number")
    .int("targetCount must be an integer")
    .min(0),
});

export { yearSchema, addBookToGoalSchema, setYearTargetSchema };
