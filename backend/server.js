const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { initializeWebSocket } = require('./utils/websocket');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });
const app = require('./app');
require('./utils/cronJobs');

const DB = process.env.DATABASE

// .replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );

// mongoose
//   .connect(DB)
//   .then(() => console.log('DB connection successful!'));

mongoose
  .connect(DB, {
    dbName: 'purwash_mvp'
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Initialize Socket.io
const allowedOrigins = new Set([
  'https://purwash.onrender.com',
  'https://purwash-rider.vercel.app',
  'https://purwash-partner.vercel.app',
  'https://purwash-admin.vercel.app',
  'https://purwash-client.vercel.app'
]);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected users by role
const connectedUsers = {
  riders: new Map(),
  partners: new Map(),
  admins: new Map()
};

io.on('connection', (socket) => {
  console.log(`WebSocket connected: ${socket.id}`);
  
  // Handle user authentication and role assignment
  socket.on('authenticate', (userData) => {
    const { userId, role } = userData;
    socket.userId = userId;
    socket.role = role;
    
    // Store user connection
    if (role === 'rider') {
      connectedUsers.riders.set(userId, socket);
    } else if (role === 'partner') {
      connectedUsers.partners.set(userId, socket);
    } else if (role === 'admin') {
      connectedUsers.admins.set(userId, socket);
    }
    
    console.log(`User ${userId} connected as ${role}`);
  });
  
  // Handle new order assignments
  socket.on('assign_order', (orderData) => {
    const { riderId, partnerId, order } = orderData;
    
    // Send to specific rider
    if (riderId && connectedUsers.riders.has(riderId)) {
      connectedUsers.riders.get(riderId).emit('new_order', order);
    }
    
    // Send to specific partner
    if (partnerId && connectedUsers.partners.has(partnerId)) {
      connectedUsers.partners.get(partnerId).emit('new_order', order);
    }
    
    // Send to all admins for monitoring
    connectedUsers.admins.forEach(adminSocket => {
      adminSocket.emit('order_assigned', order);
    });
  });
  
  // Handle order status updates
  socket.on('update_order_status', (data) => {
    const { orderId, status, userId } = data;
    
    // Broadcast to relevant users
    io.emit('order_status_update', {
      orderId,
      status,
      updatedBy: userId,
      timestamp: new Date()
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId && socket.role) {
      if (socket.role === 'rider') {
        connectedUsers.riders.delete(socket.userId);
      } else if (socket.role === 'partner') {
        connectedUsers.partners.delete(socket.userId);
      } else if (socket.role === 'admin') {
        connectedUsers.admins.delete(socket.userId);
      }
      
      console.log(`User ${socket.userId} (${socket.role}) disconnected`);
    }
  });
});

console.log('WebSocket server initialized');

// Initialize WebSocket utility
initializeWebSocket(io);

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
