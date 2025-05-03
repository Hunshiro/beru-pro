const mongoose = require('mongoose');

const mommyUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  gloryPoints: { type: Number, default: 0 },
  rank: { type: String, default: 'Baby Girl' },
  dailyPoints: {
    date: { type: String, default: '' }, // Format: YYYY-MM-DD
    pointsReceived: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('MommyUser', mommyUserSchema);