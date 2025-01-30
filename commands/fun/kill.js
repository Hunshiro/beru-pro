const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'kill',
  description: 'Kill someone (in a playful way)!',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    try {
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: process.env.GIPHY_API_KEY,
          q: 'kill',
          limit: 20,
        }
      });
      const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`${message.author} kills ${target} (in a playful way)`)
        .setImage(randomGif.images.original.url)
        .setFooter({ text: 'Powered by Giphy' });

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('There was an error fetching the kill GIF!');
    }
  },
};
