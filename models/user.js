const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  riddlesSolved: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  achievements: { type: [String], default: [] },
  currentRiddle: {
    question: { type: String },
    answer: { type: String },
    revealed: { type: String, default: '' },
    hintsGiven: { type: Number, default: 0 }
  },
  points: { type: Number, default: 0 },
  registered: { type: Boolean, default: false },
  lastVoteDate: { type: String, default: null },
  pointsGiven: { type: Number, default: 0 },
  age: { type: Number },
  sex: { type: String },
  horoscope: { type: String },
  sexualPreference: { type: String },
  status: { type: String },
  likes: { type: String },
  dislikes: { type: String },
  hobbies: { type: String },
  image: { type: String }, // URL of the profile image
  partner: { type: String, default: null },
});

module.exports = mongoose.model('User', userSchema);
