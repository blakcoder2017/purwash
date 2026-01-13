export interface Item {
    name: string;
    price: number;
    quantity: number;
    serviceType?: string;
}

export interface Order {
    _id: string;
    friendlyId: string;
    status: 'dropped_at_laundry' | 'washing' | 'ready_for_pick';
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
    items: Item[];
    pricing: {
        itemsSubtotal?: number;
        totalAmount: number;
    };
    createdAt: string;
    notes?: string; // Optional notes
    riderPhoneNumber?: string;
    riderLocation?: {
        lat: number;
        lng: number;
    };
}

export enum View {
    Dashboard = 'DASHBOARD',
    Earnings = 'EARNINGS',
}

export type OrderStatus = 'dropped_at_laundry' | 'washing' | 'ready_for_pick';
export type FilterStatus = OrderStatus | 'all';
