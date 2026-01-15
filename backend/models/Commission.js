// const mongoose = require('mongoose');

// /**
//  * Commission Schema
//  * Tracks commissions earned by riders and partners from order payments
//  */
// const CommissionSchema = new mongoose.Schema({
//   // Order reference
//   orderId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Order',
//     required: true
//   },
  
//   // Who earned this commission
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   userRole: {
//     type: String,
//     enum: ['rider', 'partner'],
//     required: true
//   },
  
//   // Commission details
//   commissionType: {
//     type: String,
//     enum: ['delivery_fee', 'service_fee', 'bonus', 'penalty'],
//     required: true
//   },
  
//   // Financial details
//   amount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
  
//   // Calculation breakdown
//   calculation: {
//     baseAmount: Number,        // Original amount (delivery fee, service fee, etc.)
//     percentage: Number,        // Commission percentage (if applicable)
//     fixedAmount: Number,       // Fixed commission amount (if applicable)
//     formula: String           // Human-readable formula
//   },
  
//   // Payout Tracking - SIMPLIFIED
//   payoutStatus: {
//     type: String,
//     enum: [
//       'pending_settlement', // Just earned, waiting for T+1
//       'ready_for_payout',   // 24h passed, Admin can transfer now
//       'processing',         // Transfer initiated
//       'paid',               // Money sent successfully
//       'failed'              // Transfer failed
//     ],
//     default: 'pending_settlement',
//     index: true
//   },
  
//   // Paystack Transfer Details
//   transferDetails: {
//     transferCode: String,      // Paystack Transfer Code (TRF_...)
//     reference: String,         // Unique Payout Ref
//     transferredAt: Date,
//     failureReason: String
//   },
  
//   // Order status at time of commission
//   orderStatus: {
//     type: String,
//     required: true
//   },
  
//   // Confirmation details
//   confirmedBy: {
//     type: String,
//     enum: ['client', 'admin', 'system'],
//     required: true
//   },
//   confirmedAt: {
//     type: Date,
//     default: Date.now
//   },
  
//   // Metadata
//   notes: String,
//   metadata: {
//     source: String,           // 'order_completion', 'manual_adjustment', etc.
//     adjustedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'AdminUser'
//     },
//     adjustmentReason: String
//   }
// }, { 
//   timestamps: true,
//   indexes: [
//     { userId: 1, createdAt: -1 },
//     { orderId: 1, userId: 1 },
//     { payoutStatus: 1, createdAt: -1 },
//     { commissionType: 1, createdAt: -1 }
//   ]
// });

// // Static method to create commissions for an order
// CommissionSchema.statics.createOrderCommissions = async function(order, confirmedBy = 'client') {
//   const Config = mongoose.model('Config');
//   const config = await Config.findOne();
  
//   const commissions = [];
  
//   // Convert everything to Pesewas for accurate calculations
//   const baseCostPesewas = Math.round((order.pricing.itemsSubtotal || 0) * 100);
//   const deliveryFeePesewas = Math.round((config.deliveryFee || 0) * 100);
//   const platformItemFeePesewas = Math.round((config.platformPerItemFee || 0) * 100);
  
//   // Calculate platform percentage fee (9% of base cost)
//   const platformPercentageFeePesewas = Math.round(baseCostPesewas * (config.platformFeePercentage / 100));
  
//   // Calculate total item commission (₵1 per item)
//   const itemCount = order.items ? order.items.length : 0;
//   const totalItemCommissionPesewas = itemCount * platformItemFeePesewas;
  
//   // Calculate platform total revenue
//   const platformRevenuePesewas = platformPercentageFeePesewas + totalItemCommissionPesewas;
  
//   // Calculate partner payout (base cost minus item commission)
//   const partnerPayoutPesewas = baseCostPesewas - totalItemCommissionPesewas;
  
//   // Calculate rider payout (100% of delivery fee)
//   const riderPayoutPesewas = deliveryFeePesewas;
  
//   // Create platform commission record
//   commissions.push({
//     orderId: order._id,
//     userId: null, // Platform commission (no specific user)
//     userRole: 'platform',
//     commissionType: 'platform_fee',
//     amount: platformRevenuePesewas / 100, // Convert back to GHS
//     calculation: {
//       baseAmount: baseCostPesewas / 100,
//       percentageFee: platformPercentageFeePesewas / 100,
//       itemCommission: totalItemCommissionPesewas / 100,
//       totalRevenue: platformRevenuePesewas / 100,
//       formula: `${(platformPercentageFeePesewas / 100)} (percentage) + ${(totalItemCommissionPesewas / 100)} (item fees) = ${(platformRevenuePesewas / 100)}`
//     },
//     payoutStatus: 'pending_settlement', // New status field
//     orderStatus: order.status,
//     confirmedBy,
//     notes: 'Platform revenue from percentage fee + per-item commission'
//   });
  
//   // Create rider commission record
//   if (order.rider) {
//     commissions.push({
//       orderId: order._id,
//       userId: order.rider,
//       userRole: 'rider',
//       commissionType: 'delivery_fee',
//       amount: riderPayoutPesewas / 100, // Convert back to GHS
//       calculation: {
//         baseAmount: deliveryFeePesewas / 100,
//         percentage: 100,
//         formula: `${(deliveryFeePesewas / 100)} × 100% = ${(riderPayoutPesewas / 100)}`
//       },
//       payoutStatus: 'pending_settlement', // New status field
//       orderStatus: order.status,
//       confirmedBy,
//       notes: 'Rider payout from delivery fee (100%)'
//     });
//   }
  
//   // Create partner commission record
//   if (order.laundry) {
//     commissions.push({
//       orderId: order._id,
//       userId: order.laundry,
//       userRole: 'partner',
//       commissionType: 'service_fee',
//       amount: partnerPayoutPesewas / 100, // Convert back to GHS
//       calculation: {
//         baseAmount: baseCostPesewas / 100,
//         deductions: {
//           itemCommission: totalItemCommissionPesewas / 100
//         },
//         formula: `${(baseCostPesewas / 100)} - ${(totalItemCommissionPesewas / 100)} (item fees) = ${(partnerPayoutPesewas / 100)}`
//       },
//       payoutStatus: 'pending_settlement', 
//       orderStatus: order.status,
//       confirmedBy,
//       notes: 'Partner payout (base cost minus platform per-item fees)'
//     });
//   }
  
//   // Create all commissions
//   const createdCommissions = await this.insertMany(commissions);
  
//   // Update user wallet balances (only for rider and partner)
//   await this.updateWalletBalances(createdCommissions);
  
//   return createdCommissions;
// };

// // Static method to update wallet balances
// CommissionSchema.statics.updateWalletBalances = async function(commissions) {
//   const User = mongoose.model('User');
//   const Earnings = mongoose.model('Earnings');
  
//   for (const commission of commissions) {
//     // Skip platform commissions (userId is null)
//     if (!commission.userId) continue;
    
//     // Update user wallet
//     await User.findByIdAndUpdate(commission.userId, {
//       $inc: {
//         'wallet.totalEarned': commission.amount,
//         'wallet.pendingBalance': commission.amount
//       }
//     });
    
//     // Add to earnings transactions
//     try {
//       await Earnings.findOneAndUpdate(
//         { userId: commission.userId },
//         {
//           $push: {
//             transactions: {
//               type: 'earning',
//               amount: commission.amount,
//               description: `${commission.userRole} commission - ${commission.commissionType}`,
//               orderId: commission.orderId,
//               createdAt: commission.confirmedAt
//             }
//           },
//           $inc: {
//             'wallet.totalEarned': commission.amount,
//             'wallet.pendingBalance': commission.amount
//           }
//         },
//         { upsert: true, new: true }
//       );
//     } catch (error) {
//       console.error('Error updating earnings for user:', commission.userId, error);
//     }
//   }
// };

// // Static method to mark commission as paid
// CommissionSchema.statics.markAsPaid = async function(commissionId, disbursementReference) {
//   const commission = await this.findByIdAndUpdate(
//     commissionId,
//     {
//       'paymentDetails.status': 'paid',
//       'paymentDetails.paidAt': new Date(),
//       'paymentDetails.disbursementReference': disbursementReference
//     },
//     { new: true }
//   );
  
//   if (commission) {
//     // Update user wallet (move from pending to earned)
//     const User = mongoose.model('User');
//     await User.findByIdAndUpdate(commission.userId, {
//       $inc: {
//         'wallet.pendingBalance': -commission.amount
//       }
//     });
//   }
  
//   return commission;
// };

// // Virtual for commission age
// CommissionSchema.virtual('ageInHours').get(function() {
//   return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
// });

// module.exports = mongoose.model('Commission', CommissionSchema);
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
    // Allowed to be null for 'platform' commissions
    required: false 
  },
  userRole: {
    type: String,
    enum: ['rider', 'partner', 'platform'],
    required: true
  },
  
  // Commission details
  commissionType: {
    type: String,
    enum: ['delivery_fee', 'service_fee', 'platform_fee', 'bonus', 'penalty'],
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
    deductions: mongoose.Schema.Types.Mixed, // Allow object for deductions
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
  
  // Paystack Transfer Details (For automated payouts)
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
  
  // Safety check for missing config
  let config;
  try {
    config = await Config.findOne();
  } catch (err) {
    console.warn("Config not found, using defaults");
  }

  // Default values if config is missing
  const deliveryFee = config?.deliveryFee || 10;
  const platformPerItemFee = config?.platformPerItemFee || 1;
  const platformFeePercentage = config?.platformFeePercentage || 9;
  
  const commissions = [];
  
  // Convert everything to Pesewas for accurate calculations
  const itemsSubtotal = order.pricing?.itemsSubtotal || 0;
  
  const baseCostPesewas = Math.round(itemsSubtotal * 100);
  const deliveryFeePesewas = Math.round(deliveryFee * 100);
  const platformItemFeePesewas = Math.round(platformPerItemFee * 100);
  
  // Calculate platform percentage fee
  const platformPercentageFeePesewas = Math.round(baseCostPesewas * (platformFeePercentage / 100));
  
  // Calculate total item commission
  const itemCount = order.items ? order.items.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0;
  const totalItemCommissionPesewas = itemCount * platformItemFeePesewas;
  
  // Calculate platform total revenue
  const platformRevenuePesewas = platformPercentageFeePesewas + totalItemCommissionPesewas;
  
  // Calculate partner payout (base cost minus item commission)
  const partnerPayoutPesewas = baseCostPesewas - totalItemCommissionPesewas;
  
  // Rider gets fixed ₵10 (1000 pesewas)
  const riderFixedFeePesewas = 1000; // ₵10 in pesewas
  
  // 1. Create PLATFORM commission record
  commissions.push({
    orderId: order._id,
    userId: null, 
    userRole: 'platform',
    commissionType: 'platform_fee',
    amount: platformRevenuePesewas / 100,
    calculation: {
      baseAmount: baseCostPesewas / 100,
      percentage: platformFeePercentage,
      formula: `${(platformPercentageFeePesewas / 100)} (%) + ${(totalItemCommissionPesewas / 100)} (items) = ${(platformRevenuePesewas / 100)}`
    },
    payoutStatus: 'paid', // Platform money is instantly available
    orderStatus: order.status,
    confirmedBy,
    notes: 'Platform revenue (percentage + per-item fee)'
  });
  
  // 2. Create RIDER commission record
  if (order.rider) {
    commissions.push({
      orderId: order._id,
      userId: order.rider,
      userRole: 'rider',
      commissionType: 'delivery_fee',
      amount: riderFixedFeePesewas / 100, // Fixed ₵10
      calculation: {
        baseAmount: riderFixedFeePesewas / 100,
        percentage: 100,
        formula: `Fixed fee = ₵${(riderFixedFeePesewas / 100)}`
      },
      payoutStatus: 'pending_settlement',
      orderStatus: order.status,
      confirmedBy,
      notes: 'Rider payout (fixed ₵10)'
    });
  }
  
  // 3. Create PARTNER commission record
  if (order.laundry) { 
    commissions.push({
      orderId: order._id,
      userId: order.laundry,
      userRole: 'partner',
      commissionType: 'service_fee',
      amount: partnerPayoutPesewas / 100,
      calculation: {
        baseAmount: baseCostPesewas / 100,
        deductions: { itemCommission: totalItemCommissionPesewas / 100 },
        formula: `${(baseCostPesewas / 100)} - ${(totalItemCommissionPesewas / 100)} (fees) = ${(partnerPayoutPesewas / 100)}`
      },
      payoutStatus: 'pending_settlement', 
      orderStatus: order.status,
      confirmedBy,
      notes: 'Partner payout (Base cost - Platform fees)'
    });
  }
  
  // Create all commissions
  if (commissions.length > 0) {
    const createdCommissions = await this.insertMany(commissions);
    // Update user wallet balances (only for rider and partner)
    await this.updateWalletBalances(createdCommissions);
    return createdCommissions;
  }
  return [];
};

// Create only missing commissions for an order (used when rider/partner assigned after payment)
CommissionSchema.statics.createMissingOrderCommissions = async function(order, confirmedBy = 'admin') {
  const existing = await this.find({ orderId: order._id }).select('userRole').lean();
  const existingRoles = new Set(existing.map(item => item.userRole));

  const Config = mongoose.model('Config');
  let config;
  try {
    config = await Config.findOne();
  } catch (err) {
    console.warn("Config not found, using defaults");
  }

  const deliveryFee = config?.deliveryFee || 10;
  const platformPerItemFee = config?.platformPerItemFee || 1;
  const platformFeePercentage = config?.platformFeePercentage || 9;

  const commissions = [];
  const itemsSubtotal = order.pricing?.itemsSubtotal || 0;
  const baseCostPesewas = Math.round(itemsSubtotal * 100);
  const deliveryFeePesewas = Math.round(deliveryFee * 100);
  const platformItemFeePesewas = Math.round(platformPerItemFee * 100);

  const platformPercentageFeePesewas = Math.round(baseCostPesewas * (platformFeePercentage / 100));
  const itemCount = order.items ? order.items.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0;
  const totalItemCommissionPesewas = itemCount * platformItemFeePesewas;
  const partnerPayoutPesewas = baseCostPesewas - totalItemCommissionPesewas;
  const riderFixedFeePesewas = 1000;

  if (order.rider && !existingRoles.has('rider')) {
    commissions.push({
      orderId: order._id,
      userId: order.rider,
      userRole: 'rider',
      commissionType: 'delivery_fee',
      amount: riderFixedFeePesewas / 100,
      calculation: {
        baseAmount: riderFixedFeePesewas / 100,
        percentage: 100,
        formula: `Fixed fee = ₵${(riderFixedFeePesewas / 100)}`
      },
      payoutStatus: 'pending_settlement',
      orderStatus: order.status,
      confirmedBy,
      notes: 'Rider payout (fixed ₵10)'
    });
  }

  if (order.laundry && !existingRoles.has('partner')) {
    commissions.push({
      orderId: order._id,
      userId: order.laundry,
      userRole: 'partner',
      commissionType: 'service_fee',
      amount: partnerPayoutPesewas / 100,
      calculation: {
        baseAmount: baseCostPesewas / 100,
        deductions: { itemCommission: totalItemCommissionPesewas / 100 },
        formula: `${(baseCostPesewas / 100)} - ${(totalItemCommissionPesewas / 100)} (fees) = ${(partnerPayoutPesewas / 100)}`
      },
      payoutStatus: 'pending_settlement',
      orderStatus: order.status,
      confirmedBy,
      notes: 'Partner payout (Base cost - Platform fees)'
    });
  }

  if (commissions.length > 0) {
    const created = await this.insertMany(commissions);
    await this.updateWalletBalances(created);
    return created;
  }
  return [];
};

// Static method to update wallet balances
CommissionSchema.statics.updateWalletBalances = async function(commissions) {
  const User = mongoose.model('User');
  const Earnings = mongoose.model('Earnings');
  
  for (const commission of commissions) {
    // Skip platform commissions (userId is null)
    if (!commission.userId) continue;
    
    // Update User Wallet
    await User.findByIdAndUpdate(commission.userId, {
      $inc: {
        'wallet.totalEarned': commission.amount,
        'wallet.pendingBalance': commission.amount
      }
    });
    
    // Update Earnings History
    try {
      await Earnings.findOneAndUpdate(
        { userId: commission.userId },
        {
          $push: {
            transactions: {
              type: 'earning',
              amount: commission.amount,
              description: `${commission.userRole === 'rider' ? 'Delivery' : 'Service'} Fee - Order #${commission.orderId.toString().slice(-6)}`,
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
      console.error(`Failed to update earnings history for user ${commission.userId}:`, error);
    }
  }
};

// Static method to process a payout (mark as paid)
CommissionSchema.statics.markAsPaid = async function(commissionIds, reference) {
  // Handle single ID or array
  const ids = Array.isArray(commissionIds) ? commissionIds : [commissionIds];

  const updateResult = await this.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        payoutStatus: 'paid',
        'transferDetails.reference': reference,
        'transferDetails.transferredAt': new Date()
      }
    }
  );
  
  return updateResult;
};

module.exports = mongoose.model('Commission', CommissionSchema);