import { z } from "zod";

export const promotionSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  type: z.enum(["product", "delivery"]),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().min(0, "O valor do desconto deve ser positivo."),
  productId: z.string().optional(),
  isActive: z.boolean().default(true),
}).refine(data => {
    if (data.type === 'product' && !data.productId) {
        return false;
    }
    return true;
}, {
    message: "É necessário selecionar um produto para promoções do tipo 'Produto Específico'.",
    path: ["productId"],
});
