const axios = require('axios');
const { EmbedBuilder } = require('discord.js')
require('dotenv').config();
module.exports = {
    name: 'fuck',
    description: 'Fuck someone!',
    async execute(message, args) {
      const target = message.mentions.users.first();
      if (!target) return message.reply('You need to mention someone to fuck!');
      
      // Fetch cuddle GIF
      try {
        const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
          params: {
            api_key: process.env.GIPHY_API_KEY,
            q: 'sex',
            limit: 20,
          }
        });
  
        const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setDescription(`${message.author} fucks ${target}`)
          .setImage(randomGif.images.original.url)
          .setFooter({ text: 'Powered by Giphy' });
  
        message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.reply('There was an error fetching the cuddle GIF!');
      }
    },
  };
  