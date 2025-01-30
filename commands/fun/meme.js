const axios = require('axios'); // Ensure axios is installed in your project: npm install axios
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'meme',
  description: 'Fetch a random meme from the internet!',
  async execute(message, args, client) {
    try {
      // Fetch a random meme from the API
      const response = await axios.get('https://meme-api.com/gimme');
      const meme = response.data;

      // Create an embed with the meme details
      const embed = new EmbedBuilder()
        .setTitle(meme.title)
        .setImage(meme.url)
        .setColor('#00FFCC')
        .setFooter({ text: `Subreddit: ${meme.subreddit}` })
        .setURL(meme.postLink);

      // Send the embed to the channel
      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching meme:', error);
      message.channel.send('Oops! I couldn’t fetch a meme right now. Try again later!');
    }
  },
};
