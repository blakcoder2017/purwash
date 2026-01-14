/**
 * logic for weWash Ghana Pricing
 * @param {Array} items - List of items in order
 * @param {Object} config - Config from DB (fees)
 */
const calculateOrderTotal = (items, config) => {
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const serviceFee = (itemsSubtotal * (config.serviceFeePercent / 100));
  const systemFee = totalItemsCount * config.systemPerItemFee;
  const deliveryFee = config.deliveryFeeFlat;

  const totalAmount = itemsSubtotal + serviceFee + systemFee + deliveryFee;

  return {
    itemsSubtotal: parseFloat(itemsSubtotal.toFixed(2)),
    serviceFee: parseFloat(serviceFee.toFixed(2)),
    systemFee: parseFloat(systemFee.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

module.exports = {
  calculateOrderTotal
};