const { EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy');

module.exports = {
    name: 'withdraw',
    description: 'Withdraw money from bank to wallet.',
    async execute(message, args) {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) {
        return message.reply('Please provide a valid amount to withdraw.');
      }
  
      try {
        const userData = await Economy.findOne({ userId: message.author.id });
        if (!userData) {
          return message.reply('You have no account. Please create one first.');
        }
  
        if (userData.bankBalance < amount) {
          return message.reply('You do not have enough money in your bank.');
        }
  
        userData.bankBalance -= amount;
        userData.balance += amount;
        await userData.save();
  
        const embed = new EmbedBuilder()
          .setColor('#32CD32')
          .setTitle('Withdrawal Successful')
          .setDescription(`Successfully withdrew **${amount} lumis** from your bank to your wallet.`)
          .setTimestamp();
  
        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.reply('There was an error withdrawing the money.');
      }
    }
  };
  