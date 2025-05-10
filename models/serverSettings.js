const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    xpReward: { type: Number, default: 10 },
    cooldownSeconds: { type: Number, default: 30 }
});

module.exports = mongoose.model('ServerSettings', serverSettingsSchema);
