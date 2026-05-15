export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  // Superadmin always has access
  if (req.user.role === 'superadmin') {
    return next();
  }
  
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied — insufficient role' 
    });
  }
  
  next();
};

export const requireAnyPermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  // Superadmin always has access
  if (req.user.role === 'superadmin') {
    return next();
  }
  
  const hasPermission = permissions.some(permission => 
    req.user.permissions?.[permission] === true
  );
  
  if (!hasPermission) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied — insufficient permissions' 
    });
  }
  
  next();
};

export default { requireRole, requireAnyPermission };