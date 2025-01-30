const mongoose = require('mongoose');
const { mongoURI } = require('../config');

// Replace with your actual MongoDB URI
 // Adjust this according to your setup

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    
    const db = mongoose.connection;

    // Step 1: Check and drop unwanted index (if exists)
    db.collection('users').indexes()
      .then(indexes => {
        const emailIndex = indexes.find(index => index.name === 'email_1');

        if (emailIndex) {
          console.log('Found duplicate index for email. Dropping index...');
          return db.collection('users').dropIndex('email_1');
        } else {
          console.log('No email index found.');
        }
      })
      .then(() => {
        // Step 2: Delete documents where 'email' is null (if present)
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        return User.deleteMany({ email: null });
      })
      .then(result => {
        console.log('Deleted documents with null email:', result);
      })
      .catch(err => {
        console.error('Error during operations:', err);
      })
      .finally(() => {
        // Disconnect after cleanup
        mongoose.disconnect();
      });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
