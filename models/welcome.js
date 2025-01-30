const mongoose = require('mongoose');

const welcomeSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelName: { type: String, default: null }, // Not needed for DM-only, but keeping it in case of future use
  serverMessage: { type: String, default: null }, // Not needed for DM-only, but keeping it
  dmMessage: { type: String, default: null },
  dmLinks: { type: String, default: null }, // New field for storing links
});

module.exports = mongoose.model('Welcome', welcomeSchema);
