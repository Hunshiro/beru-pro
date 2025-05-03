const mongoose = require('mongoose');
const MommyUser = require('../../models/mommyuser');

const ranks = [
  { name: 'Baby Girl', emoji: '👶', threshold: 0, color: '#ff99cc' },
  { name: 'Sweetie', emoji: '💗', threshold: 20, color: '#ff66b2' },
  { name: 'Princess', emoji: '👸', threshold: 40, color: '#ff3399' },
  { name: 'Queen', emoji: '👑', threshold: 60, color: '#cc0099' },
  { name: 'Goddess', emoji: '✨', threshold: 80, color: '#990066' },
  { name: 'Mommy', emoji: '💖', threshold: 100, color: '#660033' }
];

async function getMommyUserData(userId) {
  let user = await MommyUser.findOne({ userId });
  if (!user) {
    user = new MommyUser({ userId });
    await user.save();
  }

  // Update rank
  const currentRank = ranks.find(r => user.gloryPoints >= r.threshold && (!ranks[ranks.indexOf(r) + 1] || user.gloryPoints < ranks[ranks.indexOf(r) + 1].threshold));
  user.rank = currentRank.name;
  await user.save();

  return user;
}

async function saveMommyUserData(userId, data) {
  await MommyUser.updateOne(
    { userId },
    {
      $set: {
        gloryPoints: data.gloryPoints,
        rank: data.rank,
        dailyPoints: data.dailyPoints
      }
    },
    { upsert: true }
  );
}

async function getLeaderboardData() {
  return await MommyUser.find().sort({ gloryPoints: -1 }).limit(10);
}

module.exports = { getMommyUserData, saveMommyUserData, getLeaderboardData, ranks };