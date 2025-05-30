export interface Product {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  category?: string;
  createdAt?: Date;
}
