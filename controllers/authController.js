const User = require('../models/User');

// Login page
exports.getLogin = (req, res) => {
  res.render('login', {
    title: 'Admin Login',
    layout: 'layouts/auth'
  });
};

// Login process
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/login');
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }
    
    // Create session
    req.session.user = {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin
    };
    
    req.flash('success_msg', 'You are now logged in');
    res.redirect('/admin');
    
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'An error occurred during login');
    res.redirect('/login');
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
};