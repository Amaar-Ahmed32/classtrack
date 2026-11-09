// MongoDB connection (Atlas-ready).
// The connection string comes ONLY from the MONGODB_URI environment variable —
// never hardcode credentials here. See backend/.env.example for the format.
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy backend/.env.example to backend/.env and add your Atlas connection string.'
    );
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = { connectDB };
