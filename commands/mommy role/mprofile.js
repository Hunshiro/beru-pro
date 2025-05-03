const { AttachmentBuilder } = require('discord.js');
const { getMommyUserData } = require('./data');
const { generateProfileCanvas } = require('./canvas');

module.exports = {
  name: 'mprofile',
  description: 'Show your Mommy Role League profile card',
  async execute(message) {
    try {
      const userId = message.author.id;
      const femaleRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'female');
      if (!message.member.roles.cache.has(femaleRole?.id)) {
        return message.reply('Only members with the Female role can participate in the Mommy Role League!');
      }

      const userData = await getMommyUserData(userId);
      const buffer = await generateProfileCanvas(userData, message.member);
      if (!buffer || !(buffer instanceof Buffer)) {
        throw new Error('Invalid canvas buffer');
      }

      const attachment = new AttachmentBuilder(buffer, { name: 'mprofile.png' });
      await message.channel.send({
        content: `Here’s your Mommy Role League profile, <@${userId}> 💖`,
        files: [attachment]
      });
    } catch (error) {
      console.error('Profile card error:', error);
      return message.reply('Error generating your profile card! Please try again later.');
    }
  }
};