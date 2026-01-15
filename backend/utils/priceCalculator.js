/**
 * Unified pricing logic (matches PRICING_BREAKDOWN.md).
 * All calculations are done in Pesewas to avoid floating-point errors.
 * @param {Array} items - List of items in order
 * @param {Object} config - Config from DB (fees)
 */
const calculateOrderBreakdown = (items, config) => {
  const safeItems = Array.isArray(items) ? items : [];

  const platformFeePercentage = config?.platformFeePercentage ?? 9;
  const deliveryFee = config?.deliveryFee ?? 10;
  const platformPerItemFee = config?.platformPerItemFee ?? 1;
  const minOrderAmount = config?.minOrderAmount ?? 5;

  const itemsSubtotal = safeItems.reduce(
    (sum, item) => sum + (item.price * (item.quantity || 1)),
    0
  );

  if (itemsSubtotal < minOrderAmount) {
    throw new Error(`Minimum order amount is ₵${minOrderAmount}. Current subtotal: ₵${itemsSubtotal}`);
  }

  const itemCount = safeItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Convert to Pesewas
  const baseCostPesewas = Math.round(itemsSubtotal * 100);
  const deliveryFeePesewas = Math.round(deliveryFee * 100);
  const platformItemFeePesewas = Math.round(platformPerItemFee * 100);

  const platformPercentageFeePesewas = Math.round(
    baseCostPesewas * (platformFeePercentage / 100)
  );
  const totalItemCommissionPesewas = itemCount * platformItemFeePesewas;

  const totalClientPayPesewas =
    baseCostPesewas + platformPercentageFeePesewas + deliveryFeePesewas;

  const platformRevenuePesewas =
    platformPercentageFeePesewas + totalItemCommissionPesewas;
  const riderPayoutPesewas = deliveryFeePesewas;
  const partnerPayoutPesewas = baseCostPesewas - totalItemCommissionPesewas;

  return {
    itemsSubtotal: parseFloat((baseCostPesewas / 100).toFixed(2)),
    platformPercentageFee: parseFloat((platformPercentageFeePesewas / 100).toFixed(2)),
    platformItemCommission: parseFloat((totalItemCommissionPesewas / 100).toFixed(2)),
    deliveryFee: parseFloat((deliveryFeePesewas / 100).toFixed(2)),
    totalAmount: parseFloat((totalClientPayPesewas / 100).toFixed(2)),
    settlements: {
      platformRevenue: parseFloat((platformRevenuePesewas / 100).toFixed(2)),
      riderPayout: parseFloat((riderPayoutPesewas / 100).toFixed(2)),
      partnerPayout: parseFloat((partnerPayoutPesewas / 100).toFixed(2))
    }
  };
};

module.exports = {
  calculateOrderBreakdown
};