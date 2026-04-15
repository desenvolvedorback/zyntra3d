
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  price: z.coerce.number().min(0.01, "O preço deve ser um número positivo"),
  stock: z.coerce.number().int().min(0, "O estoque deve ser um número inteiro não negativo"),
  category: z.string().min(3, "A categoria é obrigatória"),
  imageUrl: z.string().url("Deve ser uma URL válida").or(z.literal("")).optional(),
  imageHint: z.string().optional(),
  digitalLink: z.string().url("Deve ser uma URL válida (Drive/Cloud)").or(z.literal("")).optional(),
});
