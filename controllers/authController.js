import User from '../models/User.js';
import mongoose from 'mongoose';

// Helper function to ensure DB connection on serverless executions
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) throw new Error('Database URI is missing from environment variables.');
  
  await mongoose.connect(mongoURI);
};

// Helper function to send users to the right landing page safely
const getRedirectPath = (role) => {
  const normalizedRole = (role || '').trim().toLowerCase();
  return normalizedRole === 'admin' ? '/admin' : '/dashboard';
};

// 1. Render Login Page
export const userForm = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(getRedirectPath(req.session.user.role));
  }
  res.render('login', { error: null });
};

// 2. Process Login
export const storeUser = async (req, res) => {
  try {
    // 💡 Ensure MongoDB connection before running queries
    await connectDB();

    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    // Set session data
    req.session.user = {
      _id: user._id,
      username: user.username,
      role: user.role
    };

    // SAVE SESSION FIRST, THEN REDIRECT
    req.session.save((err) => {
      if (err) console.error('Session save error during login:', err);
      return res.redirect(getRedirectPath(user.role));
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).render('login', { error: 'An error occurred during login.' });
  }
};

// 3. Render Sign-Up Page
export const registerForm = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(getRedirectPath(req.session.user.role));
  }
  res.render('register', { error: null });
};

// 4. Process Sign-Up
export const storeNewUser = async (req, res) => {
  try {
    // 💡 Ensure MongoDB connection before running queries
    await connectDB();

    const { username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { error: 'Username is already taken.' });
    }

    const newUser = new User({
      username,
      password,
      role: role === 'admin' ? 'admin' : 'student'
    });

    await newUser.save();

    req.session.user = {
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role
    };

    // Save session before redirecting on Sign-Up
    req.session.save((err) => {
      if (err) console.error('Session save error during registration:', err);
      return res.redirect(getRedirectPath(newUser.role));
    });

  } catch (err) {
    console.error('Sign-Up Error Details:', err);
    res.status(500).render('register', { error: err.message || 'An error occurred during sign-up.' });
  }
};

// 5. Dashboard View
export const dashboardUser = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  res.render('dashboard', { user: req.session.user });
};

// 6. Process Logout
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout Session Destroy Error:', err);
    res.clearCookie('connect.sid'); // Clear session cookie in browser
    res.redirect('/login');
  });
};