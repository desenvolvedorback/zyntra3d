import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  price: z.coerce.number().min(0.01, "Price must be a positive number"),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  category: z.string().min(3, "Category is required"),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  imageHint: z.string().optional().default(""),
});
