const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'blush',
  description: 'blushes at someone!',
  async execute(message, args) {
    // Fetch dance GIF
    try {
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: process.env.GIPHY_API_KEY,
          q: 'blush',
          limit: 20,
        }
      });

      const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
      const embed = new EmbedBuilder()
        .setColor('#32CD32')
        .setDescription(`${message.author} is blushing!`)
        .setImage(randomGif.images.original.url)
        .setFooter({ text: 'Powered by Giphy' });

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('There was an error fetching the blush GIF!');
    }
  },
};
