
export interface LaundryItem {
  _id: string;
  name: string;
  description: string;
  pricing: {
    clientPrice: number;
  };
  category: string;
  serviceType: string;
  isPopular?: boolean;
}

export interface OrderItem {
  itemId: string;
  quantity: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Order {
  items: OrderItem[];
  coordinates: Coordinates | null;
  landmark: string;
  phone: string;
  email: string;
}

export interface OrderStatus {
  friendlyId: string;
  status: string;
  items: { name: string; quantity: number, price: number }[];
  pricing: { totalAmount: number };
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingPreview {
    pricing: {
        itemsSubtotal: number;
        serviceFee: number;
        systemFee: number;
        deliveryFee: number;
        totalAmount: number;
    };
    items: { name: string; quantity: number, subtotal: number }[];
}
