const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    goal: { type: Number, required: true, default: 20000 }
});

module.exports = mongoose.model('Milestone', milestoneSchema);