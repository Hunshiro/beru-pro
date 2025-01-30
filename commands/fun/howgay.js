const { EmbedBuilder } = require('discord.js');
const { text } = require('express');

module.exports = {
  name: 'howgay',
  description: 'Tells how gay you are with a random percentage.',
  cooldown: 5, // cooldown in seconds
  execute(message) {
    const mentionedUser = message.mentions.users.first() || message.author;
    const gayPercentage = Math.floor(Math.random() * 101);  // Random percentage from 0 to 100
    const embed = new EmbedBuilder()
      .setColor('#ff69b4')
      .setTitle('How Gay Are You?')
      .setDescription(`${mentionedUser.username}'s gay percentage is **${gayPercentage}%**!`)
      .setFooter({ text: 'Ohh no.. Be proud of who you are!' });
    
    message.channel.send({ embeds: [embed] });
  },
};
