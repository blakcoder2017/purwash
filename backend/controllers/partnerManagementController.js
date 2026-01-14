const User = require('../models/User');
const Order = require('../models/Order');
const Earnings = require('../models/Earnings');
const logAction = require('../utils/auditLogger');

// 1. Get all partners with filtering and pagination
exports.getAllPartners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      isVerified,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { role: 'partner' };
    
    if (search) {
      filter.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.accountStatus = status;
    }
    
    if (isVerified !== undefined) {
      filter['momo.isVerified'] = isVerified === 'true';
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const partners = await User.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    // Get partner statistics
    const partnersWithStats = await Promise.all(
      partners.map(async (partner) => {
        const orderStats = await Order.aggregate([
          { $match: { laundry: partner._id } },
          { $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            totalEarnings: { $sum: '$pricing.totalAmount' }
          }}
        ]);
        
        const stats = orderStats[0] || { totalOrders: 0, completedOrders: 0, totalEarnings: 0 };
        
        // Get earnings from Earnings model if available
        const earnings = await Earnings.findOne({ userId: partner._id });
        
        return {
          ...partner.toObject(),
          stats,
          wallet: earnings?.wallet || { totalEarned: 0, pendingBalance: 0 }
        };
      })
    );

    res.json({
      success: true,
      data: {
        partners: partnersWithStats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching partners', error: error.message });
  }
};

// 2. Get single partner details
exports.getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const partner = await User.findOne({ _id: id, role: 'partner' });
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Get partner's order history
    const orders = await Order.find({ laundry: id })
      .populate('rider', 'profile.firstName profile.lastName phone')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate detailed statistics
    const orderStats = await Order.aggregate([
      { $match: { laundry: partner._id } },
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalEarnings: { $sum: '$pricing.totalAmount' },
        avgOrderValue: { $avg: '$pricing.totalAmount' }
      }}
    ]);

    // Get earnings data
    const earnings = await Earnings.findOne({ userId: partner._id });
    
    // Recent performance (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentStats = await Order.aggregate([
      { $match: { laundry: partner._id, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: null,
        recentOrders: { $sum: 1 },
        recentEarnings: { $sum: '$pricing.totalAmount' }
      }}
    ]);

    const stats = orderStats[0] || { 
      totalOrders: 0, 
      completedOrders: 0,
      cancelledOrders: 0,
      totalEarnings: 0,
      avgOrderValue: 0 
    };
    
    const recent = recentStats[0] || { recentOrders: 0, recentEarnings: 0 };

    res.json({
      partner,
      orders,
      stats,
      recent,
      wallet: earnings?.wallet || { totalEarned: 0, pendingBalance: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching partner', error: error.message });
  }
};

// 3. Update partner information
exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.wallet;
    delete updates.totalEarned;
    delete updates.paystack; // Paystack codes should be managed through verification process
    
    const partner = await User.findOneAndUpdate(
      { _id: id, role: 'partner' },
      updates, 
      { new: true, runValidators: true }
    );
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Log the action
    await logAction({
      action: 'PARTNER_UPDATE',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { updates },
      req
    });

    res.json({ message: 'Partner updated successfully', partner });
  } catch (error) {
    res.status(500).json({ message: 'Error updating partner', error: error.message });
  }
};

// 4. Toggle partner status (suspend/activate)
exports.togglePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active or suspended' });
    }
    
    const partner = await User.findOneAndUpdate(
      { _id: id, role: 'partner' },
      { 
        accountStatus: status,
        isActive: status === 'active',
        banReason: status === 'suspended' ? reason : undefined
      },
      { new: true }
    );
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Log the action
    await logAction({
      action: status === 'suspended' ? 'PARTNER_SUSPEND' : 'PARTNER_ACTIVATE',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { reason, status },
      req
    });

    res.json({ 
      message: `Partner ${status === 'suspended' ? 'suspended' : 'activated'} successfully`, 
      partner 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating partner status', error: error.message });
  }
};

// 5. Verify partner MoMo
exports.verifyPartnerMoMo = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, network, resolvedName } = req.body;
    
    const partner = await User.findOne({ _id: id, role: 'partner' });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    partner.momo.isVerified = verified;
    if (verified) {
      partner.momo.network = network;
      partner.momo.resolvedName = resolvedName;
    } else {
      partner.momo.network = null;
      partner.momo.resolvedName = null;
    }
    
    await partner.save();
    
    // Log the action
    await logAction({
      action: verified ? 'PARTNER_MOMO_VERIFY' : 'PARTNER_MOMO_UNVERIFY',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { network, resolvedName },
      req
    });
    
    res.json({ 
      message: `Partner MoMo ${verified ? 'verified' : 'unverified'} successfully`, 
      partner 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating partner MoMo verification', error: error.message });
  }
};

// 6. Get partner analytics
exports.getPartnerAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Total partners by status
    const totalPartners = await User.countDocuments({ role: 'partner' });
    const activePartners = await User.countDocuments({ role: 'partner', isActive: true });
    const verifiedPartners = await User.countDocuments({ role: 'partner', 'momo.isVerified': true });
    const suspendedPartners = await User.countDocuments({ role: 'partner', accountStatus: 'suspended' });
    
    // New partners
    const newPartners30Days = await User.countDocuments({ 
      role: 'partner',
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const newPartners90Days = await User.countDocuments({ 
      role: 'partner',
      createdAt: { $gte: ninetyDaysAgo } 
    });
    
    // Partner performance metrics
    const performanceMetrics = await Order.aggregate([
      { $match: { laundry: { $exists: true }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: '$laundry',
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        totalEarnings: { $sum: '$pricing.totalAmount' }
      }},
      { $group: {
        _id: null,
        avgOrdersPerPartner: { $avg: '$totalOrders' },
        avgEarningsPerPartner: { $avg: '$totalEarnings' },
        totalPartnerOrders: { $sum: '$totalOrders' }
      }}
    ]);
    
    // Top performing partners
    const topPartners = await Order.aggregate([
      { $match: { laundry: { $exists: true }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: '$laundry',
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        totalEarnings: { $sum: '$pricing.totalAmount' },
        completionRate: {
          $avg: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        }
      }},
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 }
    ]);
    
    // Enrich with partner details
    const topPartnersWithDetails = await Promise.all(
      topPartners.map(async (partner) => {
        const partnerDetails = await User.findOne({ _id: partner._id, role: 'partner' });
        return {
          ...partner,
          partnerDetails: partnerDetails ? {
            name: `${partnerDetails.profile.firstName} ${partnerDetails.profile.lastName}`,
            businessName: partnerDetails.businessName,
            phone: partnerDetails.profile.phone,
            momoVerified: partnerDetails.momo.isVerified
          } : null
        };
      })
    );

    const metrics = performanceMetrics[0] || { 
      avgOrdersPerPartner: 0, 
      avgEarningsPerPartner: 0, 
      totalPartnerOrders: 0 
    };

    res.json({
      totalPartners,
      activePartners,
      verifiedPartners,
      suspendedPartners,
      newPartners30Days,
      newPartners90Days,
      metrics,
      topPartners: topPartnersWithDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching partner analytics', error: error.message });
  }
};

// 7. Add note to partner
exports.addPartnerNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, type = 'general' } = req.body;
    
    const partner = await User.findOne({ _id: id, role: 'partner' });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    if (!partner.notes) {
      partner.notes = [];
    }
    
    partner.notes.push({
      content: note,
      type,
      addedBy: req.user.id,
      addedAt: new Date()
    });
    
    await partner.save();
    
    // Log the action
    await logAction({
      action: 'PARTNER_NOTE_ADDED',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { note, type },
      req
    });
    
    res.json({ message: 'Note added successfully', partner });
  } catch (error) {
    res.status(500).json({ message: 'Error adding partner note', error: error.message });
  }
};

// 8. Update partner wallet (admin adjustment)
exports.adjustPartnerWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, type = 'bonus' } = req.body; // type: 'bonus' or 'deduction'
    
    if (!amount || amount === 0) {
      return res.status(400).json({ message: 'Amount must be non-zero' });
    }
    
    const partner = await User.findOne({ _id: id, role: 'partner' });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // Find or create earnings record
    let earnings = await Earnings.findOne({ userId: id });
    if (!earnings) {
      earnings = new Earnings({
        userId: id,
        wallet: { totalEarned: 0, pendingBalance: 0 },
        transactions: []
      });
    }
    
    // Adjust wallet
    const adjustmentAmount = type === 'deduction' ? -Math.abs(amount) : Math.abs(amount);
    earnings.wallet.totalEarned += adjustmentAmount;
    
    // Add transaction record
    earnings.transactions.push({
      type: type === 'deduction' ? 'deduction' : 'bonus',
      amount: Math.abs(amount),
      description: reason,
      performedBy: req.user.id,
      createdAt: new Date()
    });
    
    await earnings.save();
    
    // Log the action
    await logAction({
      action: 'PARTNER_WALLET_ADJUSTMENT',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { amount, reason, type },
      req
    });
    
    res.json({ 
      message: `Partner wallet ${type === 'deduction' ? 'deducted' : 'credited'} successfully`, 
      wallet: earnings.wallet 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adjusting partner wallet', error: error.message });
  }
};

// 9. Delete partner (soft delete)
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const partner = await User.findOneAndUpdate(
      { _id: id, role: 'partner' },
      { 
        isActive: false,
        accountStatus: 'banned',
        banReason: reason,
        deletedAt: new Date(),
        deletedBy: req.user.id
      },
      { new: true }
    );
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // Log the action
    await logAction({
      action: 'PARTNER_DELETE',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { reason },
      req
    });
    
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting partner', error: error.message });
  }
};

// 10. Get partner locations (for map view)
exports.getPartnerLocations = async (req, res) => {
  try {
    const partners = await User.find(
      { 
        role: 'partner', 
        isActive: true,
        'location.lat': { $exists: true },
        'location.lng': { $exists: true }
      },
      'businessName location profile.phone profile.avatar momo.isVerified'
    );
    
    res.json({ partners });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching partner locations', error: error.message });
  }
};
