export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
  stock: number;
  category: string;
  createdAt: Date;
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
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'customer' | 'admin';
  cpf: string;
  phone: string;
}

export interface Order {
  id?: string;
  paymentId: string;
  items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }[];
  total: number;
  delivery: boolean;
  deliveryFee: number;
  location: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export type ProfileUpdateData = {
  displayName: string;
  cpf: string;
  phone: string;
};
