const LaundryItem = require('../models/LaundryItem');

/**
 * Laundry Item Controller
 * 
 * Handles CRUD operations for the client-facing laundry catalog
 * with embedded fee pricing model
 */

// 1. Get all active laundry items (client catalog)
const getCatalog = async (req, res) => {
  try {
    const { 
      category, 
      serviceType, 
      minPrice, 
      maxPrice, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Build query
    const query = { 'availability.isActive': true };
    
    if (category) query.category = category;
    if (serviceType) query.serviceType = serviceType;
    if (minPrice || maxPrice) {
      query['pricing.clientPrice'] = {};
      if (minPrice) query['pricing.clientPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.clientPrice'].$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const items = await LaundryItem.find(query)
      .sort({ isPopular: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-pricing.basePrice -pricing.embeddedSystemFee'); // Hide internal pricing
    
    const total = await LaundryItem.countDocuments(query);
    
    res.json({
      items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get single item details
const getItem = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const item = await LaundryItem.findOne({ 
      slug, 
      'availability.isActive': true 
    }).select('-pricing.basePrice -pricing.embeddedSystemFee');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get categories and service types (for filters)
const getFilters = async (req, res) => {
  try {
    const categories = await LaundryItem.distinct('category', { 'availability.isActive': true });
    const serviceTypes = await LaundryItem.distinct('serviceType', { 'availability.isActive': true });
    const priceRange = await LaundryItem.aggregate([
      { $match: { 'availability.isActive': true } },
      { $group: {
        _id: null,
        minPrice: { $min: '$pricing.clientPrice' },
        maxPrice: { $max: '$pricing.clientPrice' }
      }}
    ]);
    
    res.json({
      categories,
      serviceTypes,
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 100 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Get popular items (for homepage)
const getPopularItems = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const items = await LaundryItem.find({ 
      'availability.isActive': true, 
      isPopular: true 
    })
    .sort({ name: 1 })
    .limit(parseInt(limit))
    .select('-pricing.basePrice -pricing.embeddedSystemFee');
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Admin: Create new item
const createItem = async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      addedBy: req.user.id // Assuming auth middleware sets req.user.id
    };
    
    const item = new LaundryItem(itemData);
    await item.save();
    
    res.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Item with this slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// 6. Admin: Update item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user.id
    };
    
    const item = await LaundryItem.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 7. Admin: Delete/deactivate item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by deactivating
    const item = await LaundryItem.findByIdAndUpdate(
      id, 
      { 'availability.isActive': false },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ message: 'Item deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Admin: Get all items (including inactive)
const getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive = false } = req.query;
    
    const query = includeInactive === 'true' ? {} : { 'availability.isActive': true };
    
    const skip = (page - 1) * limit;
    const items = await LaundryItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('addedBy', 'name email')
      .populate('lastUpdatedBy', 'name email');
    
    const total = await LaundryItem.countDocuments(query);
    
    res.json({
      items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Calculate order total for preview
const calculateOrderPreview = async (req, res) => {
  try {
    const { items } = req.body; // [{ itemId, quantity }]
    
    // Get current config for fees
    const Config = require('../models/config');
    const config = await Config.findOne().sort({ createdAt: -1 });
    
    if (!config) {
      return res.status(500).json({ message: 'Configuration not found' });
    }
    
    // Get item details
    const itemIds = items.map(item => item.itemId);
    const laundryItems = await LaundryItem.find({ 
      _id: { $in: itemIds },
      'availability.isActive': true 
    }).select('name pricing.clientPrice');
    
    // Calculate totals
    const orderItems = items.map(orderItem => {
      const laundryItem = laundryItems.find(item => item._id.toString() === orderItem.itemId);
      if (!laundryItem) {
        throw new Error(`Item ${orderItem.itemId} not found or inactive`);
      }
      
      return {
        name: laundryItem.name,
        price: laundryItem.pricing.clientPrice,
        quantity: orderItem.quantity,
        subtotal: laundryItem.pricing.clientPrice * orderItem.quantity
      };
    });
    
    // Use existing price calculator
    const { calculateOrderTotal } = require('../utils/priceCalculator');
    const pricing = calculateOrderTotal(orderItems, config);
    
    res.json({
      items: orderItems,
      pricing,
      currency: 'GHS'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getCatalog,
  getItem,
  getFilters,
  getPopularItems,
  calculateOrderPreview,
  // Admin routes
  createItem,
  updateItem,
  deleteItem,
  getAllItems
};
