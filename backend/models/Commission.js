const mongoose = require('mongoose');

/**
 * Commission Schema
 * Tracks commissions earned by riders and partners from order payments
 */
const CommissionSchema = new mongoose.Schema({
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Who earned this commission
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['rider', 'partner'],
    required: true
  },
  
  // Commission details
  commissionType: {
    type: String,
    enum: ['delivery_fee', 'service_fee', 'bonus', 'penalty'],
    required: true
  },
  
  // Financial details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Calculation breakdown
  calculation: {
    baseAmount: Number,        // Original amount (delivery fee, service fee, etc.)
    percentage: Number,        // Commission percentage (if applicable)
    fixedAmount: Number,       // Fixed commission amount (if applicable)
    formula: String           // Human-readable formula
  },
  
  // Payout Tracking - SIMPLIFIED
  payoutStatus: {
    type: String,
    enum: [
      'pending_settlement', // Just earned, waiting for T+1
      'ready_for_payout',   // 24h passed, Admin can transfer now
      'processing',         // Transfer initiated
      'paid',               // Money sent successfully
      'failed'              // Transfer failed
    ],
    default: 'pending_settlement',
    index: true
  },
  
  // Paystack Transfer Details
  transferDetails: {
    transferCode: String,      // Paystack Transfer Code (TRF_...)
    reference: String,         // Unique Payout Ref
    transferredAt: Date,
    failureReason: String
  },
  
  // Order status at time of commission
  orderStatus: {
    type: String,
    required: true
  },
  
  // Confirmation details
  confirmedBy: {
    type: String,
    enum: ['client', 'admin', 'system'],
    required: true
  },
  confirmedAt: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  notes: String,
  metadata: {
    source: String,           // 'order_completion', 'manual_adjustment', etc.
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    adjustmentReason: String
  }
}, { 
  timestamps: true,
  indexes: [
    { userId: 1, createdAt: -1 },
    { orderId: 1, userId: 1 },
    { payoutStatus: 1, createdAt: -1 },
    { commissionType: 1, createdAt: -1 }
  ]
});

// Static method to create commissions for an order
CommissionSchema.statics.createOrderCommissions = async function(order, confirmedBy = 'client') {
  const Config = mongoose.model('Config');
  const config = await Config.findOne();
  
  const commissions = [];
  
  // Convert everything to Pesewas for accurate calculations
  const baseCostPesewas = Math.round((order.pricing.itemsSubtotal || 0) * 100);
  const deliveryFeePesewas = Math.round((config.deliveryFee || 0) * 100);
  const platformItemFeePesewas = Math.round((config.platformPerItemFee || 0) * 100);
  
  // Calculate platform percentage fee (9% of base cost)
  const platformPercentageFeePesewas = Math.round(baseCostPesewas * (config.platformFeePercentage / 100));
  
  // Calculate total item commission (₵1 per item)
  const itemCount = order.items ? order.items.length : 0;
  const totalItemCommissionPesewas = itemCount * platformItemFeePesewas;
  
  // Calculate platform total revenue
  const platformRevenuePesewas = platformPercentageFeePesewas + totalItemCommissionPesewas;
  
  // Calculate partner payout (base cost minus item commission)
  const partnerPayoutPesewas = baseCostPesewas - totalItemCommissionPesewas;
  
  // Calculate rider payout (100% of delivery fee)
  const riderPayoutPesewas = deliveryFeePesewas;
  
  // Create platform commission record
  commissions.push({
    orderId: order._id,
    userId: null, // Platform commission (no specific user)
    userRole: 'platform',
    commissionType: 'platform_fee',
    amount: platformRevenuePesewas / 100, // Convert back to GHS
    calculation: {
      baseAmount: baseCostPesewas / 100,
      percentageFee: platformPercentageFeePesewas / 100,
      itemCommission: totalItemCommissionPesewas / 100,
      totalRevenue: platformRevenuePesewas / 100,
      formula: `${(platformPercentageFeePesewas / 100)} (percentage) + ${(totalItemCommissionPesewas / 100)} (item fees) = ${(platformRevenuePesewas / 100)}`
    },
    payoutStatus: 'pending_settlement', // New status field
    orderStatus: order.status,
    confirmedBy,
    notes: 'Platform revenue from percentage fee + per-item commission'
  });
  
  // Create rider commission record
  if (order.rider) {
    commissions.push({
      orderId: order._id,
      userId: order.rider,
      userRole: 'rider',
      commissionType: 'delivery_fee',
      amount: riderPayoutPesewas / 100, // Convert back to GHS
      calculation: {
        baseAmount: deliveryFeePesewas / 100,
        percentage: 100,
        formula: `${(deliveryFeePesewas / 100)} × 100% = ${(riderPayoutPesewas / 100)}`
      },
      payoutStatus: 'pending_settlement', // New status field
      orderStatus: order.status,
      confirmedBy,
      notes: 'Rider payout from delivery fee (100%)'
    });
  }
  
  // Create partner commission record
  if (order.laundry) {
    commissions.push({
      orderId: order._id,
      userId: order.laundry,
      userRole: 'partner',
      commissionType: 'service_fee',
      amount: partnerPayoutPesewas / 100, // Convert back to GHS
      calculation: {
        baseAmount: baseCostPesewas / 100,
        deductions: {
          itemCommission: totalItemCommissionPesewas / 100
        },
        formula: `${(baseCostPesewas / 100)} - ${(totalItemCommissionPesewas / 100)} (item fees) = ${(partnerPayoutPesewas / 100)}`
      },
      payoutStatus: 'pending_settlement', 
      orderStatus: order.status,
      confirmedBy,
      notes: 'Partner payout (base cost minus platform per-item fees)'
    });
  }
  
  // Create all commissions
  const createdCommissions = await this.insertMany(commissions);
  
  // Update user wallet balances (only for rider and partner)
  await this.updateWalletBalances(createdCommissions);
  
  return createdCommissions;
};

// Static method to update wallet balances
CommissionSchema.statics.updateWalletBalances = async function(commissions) {
  const User = mongoose.model('User');
  const Earnings = mongoose.model('Earnings');
  
  for (const commission of commissions) {
    // Skip platform commissions (userId is null)
    if (!commission.userId) continue;
    
    // Update user wallet
    await User.findByIdAndUpdate(commission.userId, {
      $inc: {
        'wallet.totalEarned': commission.amount,
        'wallet.pendingBalance': commission.amount
      }
    });
    
    // Add to earnings transactions
    try {
      await Earnings.findOneAndUpdate(
        { userId: commission.userId },
        {
          $push: {
            transactions: {
              type: 'earning',
              amount: commission.amount,
              description: `${commission.userRole} commission - ${commission.commissionType}`,
              orderId: commission.orderId,
              createdAt: commission.confirmedAt
            }
          },
          $inc: {
            'wallet.totalEarned': commission.amount,
            'wallet.pendingBalance': commission.amount
          }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating earnings for user:', commission.userId, error);
    }
  }
};

// Static method to mark commission as paid
CommissionSchema.statics.markAsPaid = async function(commissionId, disbursementReference) {
  const commission = await this.findByIdAndUpdate(
    commissionId,
    {
      'paymentDetails.status': 'paid',
      'paymentDetails.paidAt': new Date(),
      'paymentDetails.disbursementReference': disbursementReference
    },
    { new: true }
  );
  
  if (commission) {
    // Update user wallet (move from pending to earned)
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(commission.userId, {
      $inc: {
        'wallet.pendingBalance': -commission.amount
      }
    });
  }
  
  return commission;
};

// Virtual for commission age
CommissionSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

module.exports = mongoose.model('Commission', CommissionSchema);
