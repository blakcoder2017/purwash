/**
 * WebSocket utility functions for real-time communication
 */

let io;

// Initialize WebSocket utility with Socket.io instance
const initializeWebSocket = (socketIo) => {
  io = socketIo;
};

/**
 * Emit event to specific user
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  
  io.sockets.sockets.forEach((socket) => {
    if (socket.userId === userId) {
      socket.emit(event, data);
    }
  });
};

/**
 * Emit event to all users with specific role
 * @param {string} role - User role (rider, partner, admin)
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToRole = (role, event, data) => {
  if (!io) return;
  
  io.sockets.sockets.forEach((socket) => {
    if (socket.role === role) {
      socket.emit(event, data);
    }
  });
};

/**
 * Emit new order assignment to rider and partner
 * @param {string} riderId - Rider user ID
 * @param {string} partnerId - Partner user ID
 * @param {object} order - Order data
 */
const emitOrderAssignment = (riderId, partnerId, order) => {
  // Send to rider
  if (riderId) {
    emitToUser(riderId, 'new_order', order);
  }
  
  // Send to partner
  if (partnerId) {
    emitToUser(partnerId, 'new_order', order);
  }
  
  // Send to all admins for monitoring
  emitToRole('admin', 'order_assigned', order);
};

/**
 * Emit order status update to all connected users
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {string} updatedBy - User ID who updated the status
 */
const emitOrderStatusUpdate = (orderId, status, updatedBy) => {
  if (!io) return;
  
  io.emit('order_status_update', {
    orderId,
    status,
    updatedBy,
    timestamp: new Date()
  });
};

/**
 * Get count of connected users by role
 * @returns {object} User counts by role
 */
const getConnectedUserCounts = () => {
  if (!io) return { riders: 0, partners: 0, admins: 0 };
  
  const counts = { riders: 0, partners: 0, admins: 0 };
  
  io.sockets.sockets.forEach((socket) => {
    if (socket.role === 'rider') counts.riders++;
    else if (socket.role === 'partner') counts.partners++;
    else if (socket.role === 'admin') counts.admins++;
  });
  
  return counts;
};

module.exports = {
  initializeWebSocket,
  emitToUser,
  emitToRole,
  emitOrderAssignment,
  emitOrderStatusUpdate,
  getConnectedUserCounts
};
