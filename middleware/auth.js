// Authentication middleware
exports.isAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/login');
};

// Already authenticated middleware (for login page)
exports.isAlreadyAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    return res.redirect('/admin');
  }
  next();
};