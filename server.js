import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import materialRoutes from './routes/materialRoutes.js';

// Import Database Connection caching helper
import './db.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxies (Vercel)
app.set('trust proxy', 1);

// 1. Template Engine Setup (Handlebars)
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// 2. Body Parsing & Static Assets Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 4. Session Middleware with Persistent Mongo Store
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day in seconds
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// 5. Mount Routes
app.use('/', authRoutes);
app.use('/', assignmentRoutes);
app.use('/materials', materialRoutes);

// 6. Local Server vs Vercel Export
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;