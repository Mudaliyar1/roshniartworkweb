// Authentication middleware
exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) { // Check if any user is logged in
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/login');
};

// Admin authorization middleware
exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) { // Check if user is logged in and is admin
    return next();
  }
  req.flash('error_msg', 'Access denied. Admin privileges required.');
  res.redirect('/');
};

// Already authenticated middleware (for login page)
exports.isAlreadyAuthenticated = (req, res, next) => {
  if (req.session.user) { // Check if any user is logged in
    return res.redirect('/'); // Redirect to home or dashboard if already logged in
  }
  next();
};