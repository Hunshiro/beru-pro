const { EmbedBuilder } = require('discord.js');
const { getMommyUserData, saveMommyUserData } = require('./data');

module.exports = {
  name: 'addglory',
  description: 'Award glory points to a Mommy Role League participant',
  async execute(message, args) {
    try {
      // Check if caller has RC Mommy role
      const rcMommyRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'rc mommy');
      if (!message.member.roles.cache.has(rcMommyRole?.id)) {
        return message.reply('Only RC Mommy members can award glory points! 🌸');
      }

      // Validate arguments
      if (args.length < 2) {
        return message.reply('Usage: `!addglory <@user> <points>`');
      }

      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return message.reply('Please mention a valid user! ✨');
      }

      const points = parseInt(args[1]);
      if (isNaN(points) || points <= 0) {
        return message.reply('Please specify a positive number of points! 💖');
      }

      // Check if target has Female role
      const targetMember = message.guild.members.cache.get(targetUser.id);
      const femaleRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'female');
      if (!targetMember.roles.cache.has(femaleRole?.id)) {
        return message.reply('Only members with the Female role can receive glory points! 👑');
      }

      // Get user data
      const userData = await getMommyUserData(targetUser.id);
      const today = new Date().toISOString().split('T')[0];

      // Reset daily points if date has changed
      if (userData.dailyPoints.date !== today) {
        userData.dailyPoints = { date: today, pointsReceived: 0 };
      }

      // Check daily limit
      const pointsToAdd = Math.min(points, 10 - userData.dailyPoints.pointsReceived);
      if (pointsToAdd <= 0) {
        return message.reply(`${targetUser.username} has already reached the daily glory point limit (10 points)! 🌟`);
      }

      // Update points
      userData.gloryPoints += pointsToAdd;
      userData.dailyPoints.pointsReceived += pointsToAdd;
      await saveMommyUserData(targetUser.id, userData);

      // Create aurafull embed
      const embed = new EmbedBuilder()
        .setColor('#ff3399') // Pink-purple Mommy aura
        .setTitle('✨ Glory Points Awarded! ✨')
        .setDescription(`🌸 <@${targetUser.id}> has been blessed with **${pointsToAdd} glory points** by <@${message.author.id}>! 💖`)
        .addFields(
          { name: 'Total Glory Points', value: `${userData.gloryPoints} 🌟`, inline: true },
          { name: 'Current Rank', value: `${userData.rank} ${ranks.find(r => r.name === userData.rank)?.emoji || '👶'}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ extension: 'png', size: 256 }))
        .setFooter({ text: 'Mommy Role League | Radiate Your Inner Glow 💫' })
        .setTimestamp();

      // Notify
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Add glory error:', error);
      return message.reply('Error awarding glory points! Please try again later. 💔');
    }
  }
};

// Ranks for emoji lookup (avoiding dependency on data.js for embed)
const ranks = [
  { name: 'Baby Girl', emoji: '👶' },
  { name: 'Sweetie', emoji: '💗' },
  { name: 'Princess', emoji: '👸' },
  { name: 'Queen', emoji: '👑' },
  { name: 'Goddess', emoji: '✨' },
  { name: 'Mommy', emoji: '💖' }
];