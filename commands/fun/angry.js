const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const { EmbedBuilder } = require('@discordjs/builders');

module.exports = {
  name: 'blowjob',
  description: 'Get a random waifu image.',
  async execute(message) {
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
