import type { Product, Promotion } from "./types";

export function applyPromotions(products: Product[], promotions: Promotion[]): Product[] {
  const productPromotions = new Map<string, Promotion>();

  // Find the best promotion for each product
  promotions.forEach(promo => {
    if (promo.isActive && promo.type === 'product' && promo.productId) {
      // For now, let's just take the first active promotion found.
      // A more complex logic could decide which promotion is "better".
      if (!productPromotions.has(promo.productId)) {
        productPromotions.set(promo.productId, promo);
      }
    }
  });

  return products.map(product => {
    const promotion = productPromotions.get(product.id);
    if (promotion) {
      let promotionalPrice = 0;
      if (promotion.discountType === 'percentage') {
        promotionalPrice = product.price * (1 - promotion.discountValue / 100);
      } else { // fixed
        promotionalPrice = product.price - promotion.discountValue;
      }
      
      return {
        ...product,
        promotion,
        promotionalPrice: promotionalPrice > 0 ? promotionalPrice : 0,
      };
    }
    return product;
  });
}
