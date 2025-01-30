const mongoose = require('mongoose');

// Define the Marriage schema
const marriageSchema = new mongoose.Schema({
    partner: {
        type: String, // Discord user ID
        required: true,
    },
    spouse: {
        type: String, // Discord user ID
        required: true,
    },
    marriage_date: {
        type: Date,
        default: Date.now,
    },
});

// Create and export the Marriage model
const Marriage = mongoose.model('Marriage', marriageSchema);
module.exports = Marriage;
