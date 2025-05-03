const { AttachmentBuilder } = require('discord.js');
const { getLeaderboardData } = require('./data');
const { generateLeaderboardCanvas } = require('./canvas');

module.exports = {
  name: 'mleaderboard',
  description: 'Show the Mommy Role League leaderboard',
  async execute(message) {
    try {
      const leaderboardData = await getLeaderboardData();
      if (!leaderboardData || leaderboardData.length === 0) {
        return message.reply('No participants in the Mommy Role League yet!');
      }

      const buffer = await generateLeaderboardCanvas(leaderboardData, message.guild);
      if (!buffer || !(buffer instanceof Buffer)) {
        throw new Error('Invalid canvas buffer');
      }

      const attachment = new AttachmentBuilder(buffer, { name: 'mleaderboard.png' });
      await message.channel.send({
        content: 'Mommy Role League Leaderboard 🌟',
        files: [attachment]
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
      return message.reply('Error generating the leaderboard! Please try again later.');
    }
  }
};