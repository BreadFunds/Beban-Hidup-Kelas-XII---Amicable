import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('CRITICAL ERROR: MONGO_URI is not defined in environment variables.');
}

// Reuse existing connection if already connected (important for Vercel/serverless environments)
if (mongoose.connection.readyState === 0) {
  mongoose.connect(mongoURI)
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error(`Database connection error: ${err.message}`));
}

const db = mongoose.connection;

db.on('error', (err) => {
  console.error(`Database runtime connection error: ${err}`);
});

export default mongoose;