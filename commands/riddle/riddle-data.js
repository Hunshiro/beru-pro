const mongoose = require('mongoose');
const User = require('../../models/user.js'); // Adjust the path to your User model

const achievements = [
  { name: 'Riddle Novice', emoji: '🧩', threshold: 1 },
  { name: 'Puzzle Adept', emoji: '🧠', threshold: 5 },
  { name: 'Master Solver', emoji: '🌟', threshold: 10 },
  { name: 'Riddle Legend', emoji: '👑', threshold: 20 }
];

async function getUserData(userId) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = new User({ userId });
    await user.save();
  }
  return user;
}

async function saveUserData(userId, data) {
  await User.updateOne(
    { userId },
    {
      $set: {
        riddlesSolved: data.riddlesSolved,
        hintsUsed: data.hintsUsed,
        attempts: data.attempts,
        achievements: data.achievements,
        currentRiddle: data.currentRiddle
      }
    },
    { upsert: true }
  );
}

function updateUserStats(userData) {
  const newAchievements = achievements.filter(
    a => a.threshold <= userData.riddlesSolved && !userData.achievements.includes(a.name)
  );
  userData.achievements.push(...newAchievements.map(a => a.name));
}

module.exports = { getUserData, saveUserData, updateUserStats, achievements };