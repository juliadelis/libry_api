import { z } from "zod";

const addToShelfSchema = z.object({
  bookId: z.string().uuid(),
  status: z
    .enum(["PLANNED", "READING", "READ", "DROPPED"], {
      error: () => ({
        message: "Status must be one of PLANNED, READING, READ, DROPPED",
      }),
    })
    .optional(),
  rating: z.coerce
    .number("Rating must be a float")
    .min(0.5)
    .max(5.0)
    .optional(),
  notes: z.string().optional(),
});

const updateShelfSchema = z.object({
  status: z
    .enum(["PLANNED", "READING", "READ", "DROPPED"], {
      error: () => ({
        message: "Status must be one of PLANNED, READING, READ, DROPPED",
      }),
    })
    .optional(),
  rating: z.coerce
    .number("Rating must be a float")
    .min(0.5)
    .max(5.0)
    .optional(),
  notes: z.string().optional(),
  pagesRead: z.coerce.number().int("Rating must be a int").optional(),
});

export { addToShelfSchema, updateShelfSchema };
