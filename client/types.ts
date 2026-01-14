export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface SavedLocation {
    label: string;
    address: string;
    coordinates: Coordinates;
    isDefault: boolean;
    createdAt: string;
}

export interface Client {
    _id: string;
    phone: string;
    name: string;
    email?: string;
    savedLocations: SavedLocation[];
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    averageOrderValue?: number;
    preferences?: {
        preferredServiceType?: string;
        preferredBagSize?: string;
        notifications?: {
            sms: boolean;
            whatsapp: boolean;
        };
    };
}

export interface LocationPayload {
    addressName: string;
    coordinates?: Coordinates | null;
    saveAsLocation?: boolean;
    locationLabel?: string;
}

export interface CreateOrderPayload {
    items: OrderItem[];
    phone: string;
    clientName: string;
    location: LocationPayload;
    paystackReference: string;
}

export interface CalculatePriceResponseData {
    pricing: {
        items: number;
        delivery: number;
        system: string;
        perItem: string;
        total: number;
    };
    config: {
        platformCommission: string;
        deliveryFee: number;
        systemPerItemFee: number;
        minOrderAmount: number;
    };
    totalAmount: number;
}

export interface LaundryItem {
  _id: string;
  name: string;
  description: string;
  serviceType?: string;
  pricing: {
    clientPrice: number;
  };
}

export interface Order {
  _id: string;
  friendlyId: string;
  status: string;
  items: OrderItem[];
  subtotal?: number;
  totalAmount: number;
  location: {
    addressName: string;
    coordinates?: Coordinates;
  };
  createdAt: string;
}

export interface TrackOrderResponseData {
  client: {
    _id: string;
    phone: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
  };
  orders: Order[];
}

export interface TrackOrderResponse {
    success: boolean;
    message: string;
    data: TrackOrderResponseData;
}

export interface CreateOrderResponse {
    success: boolean;
    message: string;
    data: {
        order: {
            _id: string;
            friendlyId: string;
            status: string;
            totalAmount: number;
            createdAt: string;
        };
        client: {
            _id: string;
            phone: string;
            name: string;
            totalOrders: number;
        };
        pricing: {
            items: number;
            delivery: number;
            system: string;
            perItem: string;
            total: number;
        };
        config: {
            platformCommission: string;
            deliveryFee: number;
            systemPerItemFee: number;
            minOrderAmount: number;
        };
        payment: {
            reference: string;
            amount: number;
            status: string;
            paidAt: string;
        };
    };
}

export interface ClientResponse {
    success: boolean;
    data: Client;
}
