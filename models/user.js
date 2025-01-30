const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
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
