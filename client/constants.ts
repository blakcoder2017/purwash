
export const ORDER_STATUS_MAP: { [key: string]: string } = {
  created: "Order Placed",
  assigned: "Rider Assigned",
  on_my_way_to_pick: "Rider Dispatched",
  picked_up: "Pickup Complete",
  dropped_at_laundry: "Arrived at Laundry",
  washing: "Washing",
  ready_for_pick: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export const ORDER_STATUSES = [
  "Order Placed",
  "Rider Assigned",
  "Rider Dispatched",
  "Pickup Complete",
  "Arrived at Laundry",
  "Washing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered"
];
