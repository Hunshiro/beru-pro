const mongoose = require('mongoose');
const { mongoURI } = require('./config');
require('dotenv').config();

// Connect to MongoDB using URI from environment variables
const connectDB = async () => {
  try {
    // Log the MONGO_URI partially to verify it is loaded (mask sensitive parts)
    const uri = process.env.MONGO_URI || '';
    const maskedUri = uri.length > 10 ? uri.substring(0, 5) + '...' + uri.substring(uri.length - 5) : uri;
    console.log('Connecting to MongoDB with URI:', maskedUri);

    await mongoose.connect(uri);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1); // Exit the process with an error code
  }
};

module.exports = connectDB;
