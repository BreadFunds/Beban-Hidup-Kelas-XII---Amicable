import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Template Engine Setup (Handlebars)
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// 2. Body Parsing & Static Assets Middleware (MUST COME BEFORE ROUTES)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 3. Session Middleware (MUST COME BEFORE ROUTES)
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// 4. Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assignmentTracker')
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// 5. Mount Routes (AFTER all middleware is initialized)
app.use('/', authRoutes);
app.use('/', assignmentRoutes);

// 6. Start Server
const PORT = process.env.PORT || 3213;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});