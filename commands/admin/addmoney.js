const { EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy');

module.exports = {
  name: 'addmoney',
  description: 'Give money to a user.',
  async execute(message, args) {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply("You need administrator permissions to use this command.");
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply('You need to mention someone to give them money!');
    
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('Please provide a valid amount!');
    }

    try {
      let userData = await Economy.findOne({ userId: target.id });
      if (!userData) {
        userData = new Economy({ userId: target.id });
      }

      userData.balance += amount;
      await userData.save();

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Money Given')
        .setDescription(`${message.author} has given **${amount} lumis** to ${target.username}.`)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('There was an error giving money to the user.');
    }
  }
};
