import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
  stock: number;
  createdAt: Timestamp;
}

export interface News {
  id:string;
  title: string;
  content: string;
  imageUrl: string;
  imageHint: string;
  createdAt: Timestamp;
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
}
