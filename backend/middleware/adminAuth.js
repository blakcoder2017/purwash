const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized: Admin access required." 
    });
  }
  next();
};

module.exports = adminAuth;