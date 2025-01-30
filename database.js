const mongoose = require('mongoose');
const { mongoURI } = require('./config');
require('dotenv').config();

// Connect to MongoDB using URI from environment variables
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1); // Exit the process with an error code
  }
};

module.exports = connectDB;
