const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: { type: String, required: true }, // Store as string
  requested: { type: String, required: true }, // Store as string
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
});

module.exports = mongoose.model('Request', requestSchema);
