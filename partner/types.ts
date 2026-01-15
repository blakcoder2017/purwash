export interface User {
    _id: string;
    email: string;
    role: 'partner' | 'rider' | 'client' | 'admin';
    profile: {
        firstName: string;
        lastName: string;
        phone: string;
    };
    businessName?: string;
    location?: {
        address: string;
        lat: number;
        lng: number;
    };
    momo?: {
        number: string;
        network: string;
        resolvedName: string;
        isVerified: boolean;
    };
    paystack?: {
        subaccountCode: string;
        recipientCode?: string;
    };
    accountStatus?: 'active' | 'suspended' | 'banned';
    isOnline?: boolean;
    createdAt?: string;
    lastLogin?: string;
    operatingHours?: {
        open: string;
        close: string;
    };
    bio?: string;
    wallet?: {
        totalEarned: number;
        pendingBalance: number;
    };
}

export interface Item {
    name: string;
    price: number;
    quantity: number;
    serviceType?: string;
}

export interface Order {
    _id: string;
    friendlyId: string;
    status: 'assigned' | 'dropped_at_laundry' | 'washing' | 'ready_for_pick' | 'delivered' | 'cancelled';
    client?: {
        phone: string;
        location: {
            addressName: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        };
    };
    location?: {
        addressName: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    items: Item[];
    pricing: {
        itemsSubtotal?: number;
        serviceFee?: number;
        deliveryFee?: number;
        systemFee?: number;
        totalAmount: number;
    };
    createdAt: string;
    notes?: string; // Optional notes
    riderPhoneNumber?: string;
    riderLocation?: {
        lat: number;
        lng: number;
    };
    rider?: {
        profile: {
            firstName: string;
            lastName: string;
            phone: string;
        };
    };
    laundry?: {
        businessName: string;
        profile: {
            firstName: string;
            lastName: string;
            phone: string;
        };
    };
}

export enum View {
    Dashboard = 'DASHBOARD',
    Earnings = 'EARNINGS',
    Profile = 'PROFILE',
}

export type OrderStatus = 'assigned' | 'dropped_at_laundry' | 'washing' | 'ready_for_pick' | 'delivered' | 'cancelled';
export type FilterStatus = OrderStatus | 'all';
