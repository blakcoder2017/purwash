
export type MomoNetwork = 'mtn' | 'vod' | 'atl';
export type UserRole = 'client' | 'admin' | 'rider' | 'partner';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  profile: {
    firstName?: string;
    lastName?: string;
    phone: string;
    avatar?: string;
  };
  isActive: boolean;
  lastLogin?: Date;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  momo?: {
    number: string;
    network: MomoNetwork;
    resolvedName: string;
    isVerified: boolean;
  };
  paystack?: {
    subaccountCode: string;
    recipientCode: string;
  };
  wallet: {
    totalEarned: number;
    pendingBalance: number;
  };
  isOnline: boolean;
  bio?: string;
  profilePicture?: string;
  operatingHours?: {
    open: string;
    close: string;
  };
  accountStatus: AccountStatus;
  banReason?: string;
  strikeCount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'created'
  | 'assigned'
  | 'on_my_way_to_pick'
  | 'picked_up'
  | 'dropped_at_laundry'
  | 'ready_for_pick'
  | 'out_for_delivery'
  | 'delivered';

export interface Order {
  _id: string;
  friendlyId: string;
  status: OrderStatus;
  client: {
    phone: string;
    location: {
      addressName: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
  };
  pricing: {
    totalAmount: number;
  };
  createdAt: string;
}

export interface WalletData {
  totalEarned: number;
  pending: number;
  paid: number;
  history: {
    id: string;
    date: string;
    amount: number;
  }[];
}
