// middleware/authmiddleware.js

// 1. Authenticate & Attach User
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    // Attach session user to req.user for controllers
    req.user = req.session.user;
    
    // Make user available to Handlebars templates globally
    res.locals.user = req.session.user;
    res.locals.isAdmin = req.session.user.role === 'admin';
    
    return next();
  }

  // If not logged in, redirect to login page
  res.redirect('/login');
};

// 2. Authorize Admin Only
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.redirect('/dashboard');
};