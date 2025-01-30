const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const { EmbedBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js'); // Import PermissionsBitField

module.exports = {
  name: 'blowjob',
  description: 'Get a random waifu image.',
  async execute(message) {
    // Check if the user has the admin role
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('You do not have permission to use this command.');
    }

    try {
      const response = await axios.get('https://nekobot.xyz/api/image?type=blowjob');
      const waifuImage = response.data.message;

      const embed = new EmbedBuilder()
        .setTitle('Here\'s your waifu!')
        .setImage(waifuImage)
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('There was an error fetching the waifu image.');
    }
  }
};
