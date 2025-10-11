// Authentication middleware
exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) { // Check if any user is logged in
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/login');
};

// Already authenticated middleware (for login page)
exports.isAlreadyAuthenticated = (req, res, next) => {
  if (req.session.user) { // Check if any user is logged in
    return res.redirect('/'); // Redirect to home or dashboard if already logged in
  }
  next();
};