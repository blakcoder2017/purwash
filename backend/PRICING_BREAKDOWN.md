# Pricing Breakdown - weWash Ghana

## Overview
This document outlines the complete pricing model, financial breakdown, and money flow for the weWash platform.

## 1. Financial Breakdown

### Example: 7 items with ₵100 base cost

| Component | Calculation | Amount (₵) | Who holds this? |
|-----------|-------------|------------|-----------------|
| Base Service Cost | Set by Partner | 100.00 | Initially held by Platform |
| Platform Fee | 9% of 100 (Base Cost) | 9.00 | Platform |
| Delivery Fee | Flat Rate | 10.00 | Rider |
| **Total Client Pays** | 100 + 9 + 10 | **119.00** | From Client |

## 2. Distribution (Payouts)

Once the ₵119.00 lands in Paystack main account:

### A. Platform Revenue (Your Share)
- **Percentage Fee**: ₵9.00
- **Item Commission**: 7 items × ₵1 = ₵7.00 (Deducted from Partner's ₵100)
- **Total Platform Revenue**: ₵16.00

### B. Rider Payout
- **Total Rider Revenue**: ₵10.00

### C. Partner (Laundry) Payout
- **Partner charged**: ₵100
- **Item deduction**: ₵1 per item × 7 items = ₵7
- **Total Partner Revenue**: ₵100 - ₵7 = ₵93.00

## 3. Logic Check & Balance

**Client Paid:** ₵119.00

**Payouts:**
- Platform: ₵16.00
- Rider: ₵10.00
- Partner: ₵93.00
- **Sum:** ₵16 + ₵10 + ₵93 = **₵119.00** ✅ (Logic is valid)

## 4. Money Flow Diagram

```
Client Pays ₵119.00
         ↓
    Paystack Account
         ↓
┌─────────────────────────────────────┐
│  Distribution Logic                  │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ Platform    │  │ Rider       │   │
│  │ Revenue:    │  │ Payout:     │   │
│  │ ₵16.00      │  │ ₵10.00      │   │
│  └─────────────┘  └─────────────┘   │
│  ┌─────────────┐                   │
│  │ Partner     │                   │
│  │ Payout:     │                   │
│  │ ₵93.00      │                   │
│  └─────────────┘                   │
└─────────────────────────────────────┘
```

## 5. Technical Implementation

### 5.1. Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `platformFeePercentage` | Number | 9 | Platform fee percentage of base cost |
| `deliveryFee` | Number | 10 | Fixed delivery fee in GHS |
| `platformPerItemFee` | Number | 1 | Platform commission per item in GHS |
| `minOrderAmount` | Number | 5 | Minimum order amount in GHS |

### 5.2. Calculation Logic (in Pesewas)

All calculations are done in Pesewas (integers) to avoid floating-point errors:

```javascript
function calculateOrderBreakdown(itemCount, baseCost) {
    // Convert to Pesewas
    const baseCostPesewas = Math.round(baseCost * 100);
    const deliveryFeePesewas = 1000; // ₵10.00
    const platformItemFeePesewas = 100; // ₵1.00 per item

    // Client Fees
    const platformPercentageFeePesewas = Math.round(baseCostPesewas * 0.09);
    const totalClientPayPesewas = baseCostPesewas + platformPercentageFeePesewas + deliveryFeePesewas;

    // Deductions
    const totalItemCommissionPesewas = itemCount * platformItemFeePesewas;

    // Settlements
    const riderPayoutPesewas = deliveryFeePesewas;
    const partnerPayoutPesewas = baseCostPesewas - totalItemCommissionPesewas;
    const platformRevenuePesewas = platformPercentageFeePesewas + totalItemCommissionPesewas;

    return {
        clientInvoice: {
            baseServiceCost: (baseCostPesewas / 100).toFixed(2),
            platformFee: (platformPercentageFeePesewas / 100).toFixed(2),
            deliveryFee: (deliveryFeePesewas / 100).toFixed(2),
            totalToPay: (totalClientPayPesewas / 100).toFixed(2)
        },
        settlements: {
            platformRevenue: (platformRevenuePesewas / 100).toFixed(2),
            riderPayout: (riderPayoutPesewas / 100).toFixed(2),
            partnerPayout: (partnerPayoutPesewas / 100).toFixed(2)
        }
    };
}
```

## 6. Commission Structure

### 6.1. Platform Commission
- **Source**: 9% of base cost + ₵1 per item
- **Purpose**: Platform revenue for service provision

### 6.2. Rider Commission
- **Source**: 100% of delivery fee
- **Purpose**: Compensation for delivery service

### 6.3. Partner Commission
- **Source**: Base cost minus platform per-item fees
- **Purpose**: Revenue for laundry services

## 7. Paystack Integration

### 7.1. Payment Flow
1. Initialize payment with `totalToPay` (₵119.00)
2. Convert to Pesewas for Paystack API (11900)
3. Verify payment success
4. Trigger transfers to recipients

### 7.2. Transfer Logic
```javascript
async function distributeFunds(riderRecipientCode, partnerRecipientCode) {
    // Pay Rider (₵10.00 = 1000 pesewas)
    await paystack.transfer.post({
        source: "balance",
        amount: 1000,
        recipient: riderRecipientCode,
        reason: "Delivery Fee for Order #123"
    });

    // Pay Partner (₵93.00 = 9300 pesewas)
    await paystack.transfer.post({
        source: "balance",
        amount: 9300,
        recipient: partnerRecipientCode,
        reason: "Payout for Order #123"
    });
}
```

## 8. Database Schema Updates

### 8.1. Config Model
```javascript
const ConfigSchema = new mongoose.Schema({
  platformFeePercentage: { type: Number, default: 9, min: 0, max: 100 },
  deliveryFee: { type: Number, default: 10, min: 0 },
  platformPerItemFee: { type: Number, default: 1, min: 0 },
  minOrderAmount: { type: Number, default: 5, min: 0 }
});
```

### 8.2. Commission Model
- Track platform fee (percentage + per-item)
- Track rider fee (delivery fee)
- Track partner fee (base cost minus deductions)

## 9. Key Benefits

1. **Transparent Pricing**: Clear breakdown for all parties
2. **Fair Distribution**: Platform earns from service fees, partner gets majority of service cost
3. **Accurate Calculations**: Using Pesewas prevents floating-point errors
4. **Scalable Model**: Easy to adjust fees via configuration
5. **Audit Trail**: Complete tracking of all transactions

## 10. Business Rules

- Platform always gets 9% of base service cost
- Platform gets ₵1 per item (deducted from partner)
- Rider gets 100% of delivery fee
- Partner gets base cost minus platform per-item fees
- All calculations in Pesewas, display in GHS
- Minimum order amount applies to base cost only
