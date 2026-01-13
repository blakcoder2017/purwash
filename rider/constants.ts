
import { OrderStatus } from './types';

export const API_BASE_URL = 'http://localhost:5000'; // Mocked, not actually used

export const STATUS_PROGRESSION: Record<OrderStatus, OrderStatus | null> = {
  created: 'assigned',
  assigned: 'on_my_way_to_pick',
  on_my_way_to_pick: 'picked_up',
  picked_up: 'dropped_at_laundry',
  dropped_at_laundry: null, // Laundry handles next step
  ready_for_pick: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
};

export const STATUS_TEXT: Record<OrderStatus, string> = {
    created: 'New Order',
    assigned: 'Start Pickup',
    on_my_way_to_pick: 'Confirm Picked Up',
    picked_up: 'Confirm Dropped at Laundry',
    dropped_at_laundry: 'Waiting for Laundry',
    ready_for_pick: 'Start Delivery',
    out_for_delivery: 'Confirm Delivered',
    delivered: 'Completed',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
    created: 'bg-gray-500',
    assigned: 'bg-primary',
    on_my_way_to_pick: 'bg-primary',
    picked_up: 'bg-primary',
    dropped_at_laundry: 'bg-gray-500',
    ready_for_pick: 'bg-green-600',
    out_for_delivery: 'bg-green-600',
    delivered: 'bg-gray-500',
};
