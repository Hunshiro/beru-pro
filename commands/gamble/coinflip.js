const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Economy = require('../../models/economy');
const cooldown = new Map();
const activeGames = new Map();

module.exports = {
  name: 'cf',
  description: '🎲 Choose h/t and bet lumis!',
  async execute(message, args) {
    const user = message.author;
    if (cooldown.has(user.id)) {
        const remaining = Date.now() - cooldown.get(user.id);
        if (remaining < 30000) {
          return message.reply(`⏳ Please wait ${Math.ceil((30000 - remaining) / 1000)}s before flipping again!`);
        }
      }

    // Initial setup
    const bet = parseInt(args[0]);
    const choice = args[1]?.toLowerCase();

    // Validate input
    if (!bet || isNaN(bet) || bet <= 0) {
      return message.reply('❌ Please specify a valid bet amount! Usage: `!cf <amount> <h/t>`');
    }
    
    if (!choice || !['h', 't'].includes(choice)) {
      return message.reply('❌ Please choose `h for heads` or `t for tails `! Usage: `!cf <amount> <h/t>`');
    }

    const userData = await Economy.findOne({ userId: user.id });
    if (!userData || userData.balance < bet) {
      return message.reply(`❌ You need at least ${bet} lumis to play!`);
    }

    // Store game state
    activeGames.set(user.id, { bet, choice });

    // Start game
    this.startGame(message, user, userData, bet, choice);
  },

  async startGame(message, user, userData, bet, choice) {
    // Initial spinning embed
    const spinEmbed = new EmbedBuilder()
      .setColor('#F5D400')
      .setTitle(`${user.username}'s lumi Flip`)
      .setDescription(`**${choice.toUpperCase()}** chosen\n\n🔄 Spinning...`)
      .setThumbnail('https://media.giphy.com/media/J3JIjI0y1rF9LpsRx8/giphy.gif?cid=790b76110n4rf5ru6fcnxfiwq9k063cfozmoflbma1nhfwfi&ep=v1_gifs_search&rid=giphy.gif&ct=g')
      .addFields(
        { name: '💰 Bet Amount', value: `\`${bet}\` lumis`, inline: true },
        { name: '🏦 Balance', value: `\`${userData.balance}\` lumis`, inline: true }
      );

    const msg = await message.channel.send({ embeds: [spinEmbed] });

    // Animated spinning effect
    const spinFaces = ['⏳', '⌛️', '🎰', '💫'];
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      spinEmbed.setDescription(`**${choice.toUpperCase()}** chosen\n\n${spinFaces[i % spinFaces.length]} Spinning...`);
      await msg.edit({ embeds: [spinEmbed] });
    }

    // Determine result
    const result = Math.random() < 0.5 ? 'h' : 't';
    const win = result === choice;
    const payout = win ? bet * 2 : -bet;

    // Update economy
    userData.balance += payout;
    await userData.save();

    // Result embed
    const resultEmbed = new EmbedBuilder()
      .setColor(win ? '#00FF00' : '#FF0000')
      .setTitle(win ? '🎉 WINNER! 🎉' : '💥 BUSTED! 💥')
      .setDescription(`${win ? '✅' : '❌'} The lumi landed on **${result.toUpperCase()}**!`)
      .setThumbnail(win ? 'https://i.gifer.com/XOsX.gif' : 'https://media.giphy.com/media/oumdjgdfS0K6awiJPa/giphy.gif?cid=ecf05e47jyukb0gsb156dtz36kvqj7qiyhv2rpded6z9rtfk&ep=v1_gifs_search&rid=giphy.gif&ct=g')
      .addFields(
        { name: '🎯 Your Choice', value: `\`${choice}\``, inline: true },
        { name: '💰 Payout', value: `\`${win ? '+' : '-'}${Math.abs(payout)}\` lumis`, inline: true },
        { name: '🏦 New Balance', value: `\`${userData.balance}\` lumis`, inline: false }
      );

    // Play again button
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('play_again')
        .setLabel('🔄 Play Again')
        .setStyle(ButtonStyle.Primary)
    );

    await msg.edit({ embeds: [resultEmbed], components: [row] });

    // Button collector
    const filter = i => i.customId === 'play_again' && i.user.id === user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async i => {
      // Check balance again
      const updatedData = await Economy.findOne({ userId: user.id });
      if (updatedData.balance < bet) {
        return i.reply({ content: "❌ You don't have enough lumis to play again!", ephemeral: true });
      }

      // Reset game with same parameters
      await i.deferUpdate();
      activeGames.set(user.id, { bet, choice });
      this.startGame(message, user, updatedData, bet, choice);
    });

    collector.on('end', () => msg.edit({ components: [] }));

    // Set cooldown
    cooldown.set(user.id, Date.now());
    setTimeout(() => cooldown.delete(user.id), 30000);
  }
};