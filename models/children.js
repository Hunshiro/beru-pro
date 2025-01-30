const mongoose = require('mongoose');

// Define the Children schema (for adoption)
const childrenSchema = new mongoose.Schema({
    parent: {
        type: String, // Discord user ID of the adopter (parent)
        required: true,
    },
    child_id: {
        type: String, // Discord user ID of the adopted child
        required: true,
    },
    child_name: {
        type: String, // Name of the adopted child (Discord username)
        required: true,
    },
    birth_date: {
        type: Date, // Birth date of the adopted child (optional)
    },
    adoption_date: {
        type: Date,
        default: Date.now, // Date when adoption occurred
    },
});

// Create and export the Children model
const Children = mongoose.model('Children', childrenSchema);
module.exports = { Children };
