const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'poke',
  description: 'Poke someone or yourself!',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author; // If no mention, default to the author

    // Fetch poke GIF
    try {
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: process.env.GIPHY_API_KEY,
          q: 'poke',
          limit: 20,
        }
      });

      const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
      const embed = new EmbedBuilder()
        .setColor('#FF4500')
        .setDescription(`${message.author} pokes ${target}`)
        .setImage(randomGif.images.original.url)
        .setFooter({ text: 'Powered by Giphy' });

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('There was an error fetching the poke GIF!');
    }
  },
};
