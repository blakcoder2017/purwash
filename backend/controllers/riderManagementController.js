const User = require('../models/User');
const Order = require('../models/Order');
const Earnings = require('../models/Earnings');
const logAction = require('../utils/auditLogger');

// 1. Get all riders with filtering and pagination
exports.getAllRiders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      isOnline,
      vehicleType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { role: 'rider' };
    
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
    
    if (isOnline !== undefined) {
      filter.isOnline = isOnline === 'true';
    }
    
    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const riders = await User.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    // Get rider statistics
    const ridersWithStats = await Promise.all(
      riders.map(async (rider) => {
        const orderStats = await Order.aggregate([
          { $match: { rider: rider._id } },
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
        const earnings = await Earnings.findOne({ userId: rider._id });
        
        return {
          ...rider.toObject(),
          stats,
          wallet: earnings?.wallet || { totalEarned: 0, pendingBalance: 0 }
        };
      })
    );

    res.json({
      success: true,
      data: {
        riders: ridersWithStats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching riders', error: error.message });
  }
};

// 2. Get single rider details
exports.getRiderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rider = await User.findOne({ _id: id, role: 'rider' });
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Get rider's order history
    const orders = await Order.find({ rider: id })
      .populate('laundry', 'businessName profile.phone')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate detailed statistics
    const orderStats = await Order.aggregate([
      { $match: { rider: rider._id } },
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
    const earnings = await Earnings.findOne({ userId: rider._id });
    
    // Recent performance (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentStats = await Order.aggregate([
      { $match: { rider: rider._id, createdAt: { $gte: thirtyDaysAgo } } },
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
      rider,
      orders,
      stats,
      recent,
      wallet: earnings?.wallet || { totalEarned: 0, pendingBalance: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rider', error: error.message });
  }
};

// 3. Update rider information
exports.updateRider = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.wallet;
    delete updates.totalEarned;
    
    const rider = await User.findOneAndUpdate(
      { _id: id, role: 'rider' },
      updates, 
      { new: true, runValidators: true }
    );
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Log the action
    await logAction({
      action: 'RIDER_UPDATE',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { updates },
      req
    });

    res.json({ message: 'Rider updated successfully', rider });
  } catch (error) {
    res.status(500).json({ message: 'Error updating rider', error: error.message });
  }
};

// 4. Toggle rider status (suspend/activate)
exports.toggleRiderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active or suspended' });
    }
    
    const rider = await User.findOneAndUpdate(
      { _id: id, role: 'rider' },
      { 
        accountStatus: status,
        isActive: status === 'active',
        banReason: status === 'suspended' ? reason : undefined,
        isOnline: status === 'active' ? false : rider.isOnline // Force offline if suspended
      },
      { new: true }
    );
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Log the action
    await logAction({
      action: status === 'suspended' ? 'RIDER_SUSPEND' : 'RIDER_ACTIVATE',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { reason, status },
      req
    });

    res.json({ 
      message: `Rider ${status === 'suspended' ? 'suspended' : 'activated'} successfully`, 
      rider 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating rider status', error: error.message });
  }
};

// 5. Get rider analytics
exports.getRiderAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Total riders by status
    const totalRiders = await User.countDocuments({ role: 'rider' });
    const activeRiders = await User.countDocuments({ role: 'rider', isActive: true });
    const onlineRiders = await User.countDocuments({ role: 'rider', isOnline: true });
    const suspendedRiders = await User.countDocuments({ role: 'rider', accountStatus: 'suspended' });
    
    // New riders
    const newRiders30Days = await User.countDocuments({ 
      role: 'rider',
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const newRiders90Days = await User.countDocuments({ 
      role: 'rider',
      createdAt: { $gte: ninetyDaysAgo } 
    });
    
    // Rider performance metrics
    const performanceMetrics = await Order.aggregate([
      { $match: { rider: { $exists: true }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: '$rider',
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        totalEarnings: { $sum: '$pricing.totalAmount' }
      }},
      { $group: {
        _id: null,
        avgOrdersPerRider: { $avg: '$totalOrders' },
        avgEarningsPerRider: { $avg: '$totalEarnings' },
        totalRiderOrders: { $sum: '$totalOrders' }
      }}
    ]);
    
    // Top performing riders
    const topRiders = await Order.aggregate([
      { $match: { rider: { $exists: true }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: '$rider',
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
    
    // Enrich with rider details
    const topRidersWithDetails = await Promise.all(
      topRiders.map(async (rider) => {
        const riderDetails = await User.findOne({ _id: rider._id, role: 'rider' });
        return {
          ...rider,
          riderDetails: riderDetails ? {
            name: `${riderDetails.profile.firstName} ${riderDetails.profile.lastName}`,
            phone: riderDetails.profile.phone,
            vehicleType: riderDetails.vehicleType
          } : null
        };
      })
    );

    const metrics = performanceMetrics[0] || { 
      avgOrdersPerRider: 0, 
      avgEarningsPerRider: 0, 
      totalRiderOrders: 0 
    };

    res.json({
      totalRiders,
      activeRiders,
      onlineRiders,
      suspendedRiders,
      newRiders30Days,
      newRiders90Days,
      metrics,
      topRiders: topRidersWithDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rider analytics', error: error.message });
  }
};

// 6. Add note to rider
exports.addRiderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, type = 'general' } = req.body;
    
    const rider = await User.findOne({ _id: id, role: 'rider' });
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    
    if (!rider.notes) {
      rider.notes = [];
    }
    
    rider.notes.push({
      content: note,
      type,
      addedBy: req.user.id,
      addedAt: new Date()
    });
    
    await rider.save();
    
    // Log the action
    await logAction({
      action: 'RIDER_NOTE_ADDED',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { note, type },
      req
    });
    
    res.json({ message: 'Note added successfully', rider });
  } catch (error) {
    res.status(500).json({ message: 'Error adding rider note', error: error.message });
  }
};

// 7. Update rider wallet (admin adjustment)
exports.adjustRiderWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, type = 'bonus' } = req.body; // type: 'bonus' or 'deduction'
    
    if (!amount || amount === 0) {
      return res.status(400).json({ message: 'Amount must be non-zero' });
    }
    
    const rider = await User.findOne({ _id: id, role: 'rider' });
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
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
      action: 'RIDER_WALLET_ADJUSTMENT',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { amount, reason, type },
      req
    });
    
    res.json({ 
      message: `Rider wallet ${type === 'deduction' ? 'deducted' : 'credited'} successfully`, 
      wallet: earnings.wallet 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adjusting rider wallet', error: error.message });
  }
};

// 8. Delete rider (soft delete)
exports.deleteRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const rider = await User.findOneAndUpdate(
      { _id: id, role: 'rider' },
      { 
        isActive: false,
        accountStatus: 'banned',
        banReason: reason,
        isOnline: false,
        deletedAt: new Date(),
        deletedBy: req.user.id
      },
      { new: true }
    );
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    
    // Log the action
    await logAction({
      action: 'RIDER_DELETE',
      performedBy: req.user.id,
      targetUser: id,
      metadata: { reason },
      req
    });
    
    res.json({ message: 'Rider deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting rider', error: error.message });
  }
};
