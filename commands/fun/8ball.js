const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: '8ball',
  description: 'Answers your yes/no question with a random response.',
  cooldown: 5, // cooldown in seconds
  execute(message, args) {
    if (!args.length) {
      return message.reply('You need to ask a question! Usage: `!8ball <question>`');
    }

    const responses = [
      'Yes',
      'No',
      'Maybe',
      'Definitely not',
      'Ask again later',
      'I have no idea',
      'Most likely',
      'Not in a million years'
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('8ball Answer')
      .setDescription(`Your question: **${args.join(' ')}**\n\nAnswer: **${response}**`)
      .setFooter({ text: 'Magic 8ball says...'});
    
    message.channel.send({ embeds: [embed] });
  },
};
