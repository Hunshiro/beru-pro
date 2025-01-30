const axios = require('axios');
const { EmbedBuilder } = require('discord.js')
require('dotenv').config();

module.exports = {
  name: 'pat',
  description: 'Pat someone!',
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('You need to mention someone to pat!');
    
    // Giphy API request
    try {
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: process.env.GIPHY_API_KEY, // Replace with your Giphy API Key
          q: 'anime pat',
          limit:20,
        }
      });
      
      // Extract the GIF URL
      const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
      
      if (!randomGif) {
        return message.reply('Sorry, I could not find a pat GIF!');
      }
      
      // Create and send the embed
      const embed = new EmbedBuilder()
        .setColor('#FFC0CB')
        .setDescription(`${message.author} pats ${target}`)
        .setImage(randomGif.images.original.url)
        .setFooter({ text: 'Powered by Giphy' });
      
      message.channel.send({ embeds: [embed] });
      
    } catch (error) {
      console.error(error);
      message.reply('There was an error fetching the GIF!');
    }
  },
};
