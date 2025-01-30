const { EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy');
const { default: axios } = require('axios');

module.exports = {
    name: 'balance',
    description: 'Check your wallet and bank balance.',
    async execute(message) {
      try {
        const userData = await Economy.findOne({ userId: message.author.id });
        if (!userData) {
          return message.reply('You have no account. Please earn some money first.');
        }
  
        const wallet = userData.balance;
        const bank = userData.bankBalance;
        // const pic = axios.get("https://www.vecteezy.com/png/9398418-bank-clipart-design-illustration");
  
        const embed = new EmbedBuilder()
          .setColor('#1E90FF')
          .setTitle('Your Balance')
          .setDescription(`**${message.author.username}'s Balance**`)
          .setThumbnail('https://www.freepik.com/free-vector/people-taking-out-money-from-bank-concept-illustration_35262251.htm#fromView=keyword&page=1&position=1&uuid=446b4376-de2b-4be0-8d5b-b9815667ba39&new_detail=true&query=Bank+Png')
          .addFields(
            { name: 'Wallet', value: `${wallet} lumis`, inline: true },
            { name: 'Bank', value: `${bank} lumis`, inline: true }
          )
        
          .setTimestamp();
  
        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.reply('There was an error fetching your balance.');
      }
    }
  };
  