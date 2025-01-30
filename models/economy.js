const mongoose = require('mongoose');

const economySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  bankBalance: {
    type: Number,
    default: 0
  },
  transactionHistory: [
    {
      type: String,
      default: []
    },
  ],
  // lastDaily: {
  //   type: Number,
  //   default: 0
  // },
  streak: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Economy', economySchema);
