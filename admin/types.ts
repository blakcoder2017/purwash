export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  activeRiders: number;
}

export interface InvestorMetrics {
  mrr: number;
  arr: number;
  arpo: number;
  growthRate: string;
}

export type OrderStatus = 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Order {
  _id: string;
  friendlyId: string;
  customer: {
    name: string;
    address: string;
  };
  status: OrderStatus;
  createdAt: string;
  itemCount: number;
  totalValue: number;
  riderId?: string;
  laundryId?: string;
}

export type PartnerRole = 'rider' | 'laundry';
export type PartnerStatus = 'active' | 'inactive' | 'banned';

export interface Partner {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: PartnerRole;
  status: PartnerStatus;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  performedBy: {
    name: string;
  };
  orderId?: {
    friendlyId: string;
  };
  metadata?: {
    reason?: string;
    [key: string]: any;
  };
  createdAt: string;
}
