const { EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy'); // Assuming you have the Economy model set up

module.exports = {
  name: 'give',
  description: 'Give money to a mentioned user.',
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('You need to mention someone to give them money!');
    
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('Please provide a valid amount to give!');
    }

    try {
      // Find the sender's data
      let senderData = await Economy.findOne({ userId: message.author.id });
      if (!senderData) {
        senderData = new Economy({ userId: message.author.id, balance: 0, bankBalance: 0 });
      }

      // Check if the sender has enough balance
      if (senderData.balance < amount) {
        return message.reply('You do not have enough money to give!');
      }

      // Find the receiver's data
      let receiverData = await Economy.findOne({ userId: target.id });
      if (!receiverData) {
        receiverData = new Economy({ userId: target.id, balance: 0, bankBalance: 0 });
      }

      // Deduct money from sender and add to receiver
      senderData.balance -= amount;
      receiverData.balance += amount;

      await senderData.save();
      await receiverData.save();

      // Create an embed to notify users
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Money Given Successfully')
        .setDescription(`${message.author} has given **${amount} lumis** to ${target.username}.`)
        .addFields(
          { name: 'Your New Balance', value: `${senderData.balance} lumis`, inline: true },
          { name: 'Receiver\'s New Balance', value: `${receiverData.balance} lumis`, inline: true }
        )
      
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply('There was an error processing the transaction.');
    }
  }
};
