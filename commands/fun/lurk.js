const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'lurk',
  description: 'Lurk around or lurk at someone!',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    try {
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: process.env.GIPHY_API_KEY,
          q: 'lurk',
          limit: 20,
        }
      });
      const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
      const embed = new EmbedBuilder()
        .setColor('#2F4F4F')
        .setDescription(`${message.author} lurks around ${target}`)
        .setImage(randomGif.images.original.url)
        .setFooter({ text: 'Powered by Giphy' });

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('There was an error fetching the lurk GIF!');
    }
  },
};
