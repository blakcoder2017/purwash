export type OrderStatus =
  | "created"
  | "assigned"
  | "on_my_way_to_pick"
  | "picked_up"
  | "dropped_at_laundry"
  | "washing"
  | "ready_for_pick"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone: string;
  avatar?: string;
}

export interface User {
  _id: string;
  email: string;
  role: "rider" | "partner" | "client" | "admin";
  profile: UserProfile;
  wallet?: {
    totalEarned: number;
    pendingBalance: number;
  };
  momo?: {
    number: string;
    network: string;
    resolvedName: string;
    isVerified: boolean;
  };
  accountStatus?: "active" | "suspended" | "banned";
  isOnline?: boolean;
  createdAt?: string;
}

export interface Order {
  _id: string;
  friendlyId: string;
  status: OrderStatus;
  client: {
    phone: string;
    location: {
      addressName: string;
      coordinates: { lat: number; lng: number };
    };
  };
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  pricing?: {
    totalAmount: number;
  };
  createdAt: string;
}
