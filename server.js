import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo'; // 1. Import MongoStore
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxies (Vercel, Render, Heroku, Nginx)
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

// 3. Database Connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// 4. Session Middleware with Persistent Mongo Store
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,
    ttl: 24 * 60 * 60 // 1 day in seconds
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true if using HTTPS
    sameSite: 'lax'
  }
}));

// 5. Mount Routes
app.use('/', authRoutes);
app.use('/', assignmentRoutes);

// 6. Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});