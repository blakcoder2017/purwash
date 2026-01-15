export type OrderStatus =
  | "assigned"
  | "dropped_at_laundry"
  | "washing"
  | "ready_for_pick"
  | "delivered"
  | "cancelled";

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone: string;
}

export interface User {
  _id: string;
  email: string;
  role: "partner" | "rider" | "client" | "admin";
  profile: UserProfile;
  businessName?: string;
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
  createdAt?: string;
}

export interface Order {
  _id: string;
  friendlyId: string;
  status: OrderStatus;
  location: {
    addressName: string;
  };
  items: {
    name: string;
    quantity: number;
  }[];
  pricing?: {
    totalAmount: number;
  };
  createdAt: string;
}
