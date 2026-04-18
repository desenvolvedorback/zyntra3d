
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
  stock: number;
  category: 'Modelos Prontos' | 'Personalizados' | 'Logotipos' | 'Arquivos 3D' | 'Pack 3D';
  createdAt: Date;
  promotion?: Promotion;
  promotionalPrice?: number;
  digitalLink?: string; // Link para download se for produto digital
}

export interface News {
  id:string;
  title: string;
  content: string;
  imageUrl: string;
  imageHint: string;
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  category?: string;
  digitalLink?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'customer' | 'admin';
  cpf: string;
  phone: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'printing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id?: string;
  orderNumber: number;
  paymentId: string | null;
  items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    digitalLink?: string;
  }[];
  total: number;
  delivery: boolean;
  deliveryFee: number;
  location: string;
  distanceKm?: number;
  fileLink?: string;
  deliverySlot?: 'morning' | 'afternoon';
  observation?: string;
  contactPhone?: string;
  status: OrderStatus;
  trackingLink?: string;
  previewImageUrl?: string;
  createdAt: Date;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Promotion {
  id: string;
  name: string;
  type: 'product' | 'delivery';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface PromotionWithProductName extends Promotion {
  productName?: string;
}
