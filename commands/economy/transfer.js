const { EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy');



module.exports = {
    name: 'transfer',
    description: 'Transfer money from wallet to bank.',
    async execute(message, args) {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) {
        return message.reply('Please provide a valid amount to transfer.');
      }
  
      try {
        const userData = await Economy.findOne({ userId: message.author.id });
        if (!userData) {
          return message.reply('You have no account. Please earn some money first.');
        }
  
        if (userData.balance < amount) {
          return message.reply('You do not have enough money in your wallet.');
        }
  
        userData.balance -= amount;
        userData.bankBalance += amount;
        await userData.save();
  
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('Transfer Successful')
          .setDescription(`Successfully transferred **${amount} lumis** from your wallet to your bank.`)
          .setTimestamp();
  
        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.reply('There was an error transferring the money.');
      }
    }
  };
  