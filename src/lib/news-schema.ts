import { z } from "zod";

export const newsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  content: z.string().min(10, "Content must be at least 10 characters long"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  imageHint: z.string().optional().default(""),
});
