const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastMessage: { type: Date, default: null },
    notifications: { type: Boolean, default: true }, // For muting level-up notifications
});

const levelRoleSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    level: { type: Number, required: true },
    roleId: { type: String, required: true },
});

const Level = mongoose.model('Level', levelSchema);
const LevelRole = mongoose.model('LevelRole', levelRoleSchema);

module.exports = { Level, LevelRole };