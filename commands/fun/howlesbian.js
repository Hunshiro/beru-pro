const {EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'howlesbian',
  description: 'Tells how lesbian you are with a random percentage.',
  cooldown: 5, // cooldown in seconds
  execute(message) {
    const mentionedUser = message.mentions.users.first() || message.author;
    const lesbianPercentage = Math.floor(Math.random() * 101);  // Random percentage from 0 to 100
    const embed = new EmbedBuilder()
      .setColor('#d700b4')
      .setTitle('How Lesbian Are You?')
      .setDescription(`${mentionedUser.username}'s lesbian percentage is **${lesbianPercentage}%**!`)
      .setFooter({ text: 'Enjoy and be proud of who you are!'});
    
    message.channel.send({ embeds: [embed] });
  },
};
