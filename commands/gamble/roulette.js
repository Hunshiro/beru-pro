const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Economy = require('../../models/economy');
const cooldown = new Map();

const WHEEL_NUMBERS = [
  { number: 0, color: '🟢' },
  { number: 32, color: '🔴' }, { number: 15, color: '⚫️' },
  { number: 19, color: '🔴' }, { number: 4, color: '⚫️' },
  { number: 21, color: '🔴' }, { number: 2, color: '⚫️' },
  { number: 25, color: '🔴' }, { number: 17, color: '⚫️' },
  { number: 34, color: '🔴' }, { number: 6, color: '⚫️' },
  { number: 27, color: '🔴' }, { number: 13, color: '⚫️' },
  { number: 36, color: '🔴' }, { number: 11, color: '⚫️' },
  { number: 30, color: '🔴' }, { number: 8, color: '⚫️' },
  { number: 23, color: '🔴' }, { number: 10, color: '⚫️' },
  { number: 5, color: '🔴' }, { number: 24, color: '⚫️' },
  { number: 16, color: '🔴' }, { number: 33, color: '⚫️' },
  { number: 1, color: '🔴' }, { number: 20, color: '⚫️' },
  { number: 14, color: '🔴' }, { number: 31, color: '⚫️' },
  { number: 9, color: '🔴' }, { number: 22, color: '⚫️' },
  { number: 18, color: '🔴' }, { number: 29, color: '⚫️' },
  { number: 7, color: '🔴' }, { number: 28, color: '⚫️' },
  { number: 12, color: '🔴' }, { number: 35, color: '⚫️' },
  { number: 3, color: '🔴' }, { number: 26, color: '⚫️' }
];

const PAYOUTS = {
  straight: 35,
  split: 17,
  color: 1,
  even_odd: 1,
  dozen: 2,
  column: 2,
  low_high: 1
};

module.exports = {
  name: 'rl',
  description: '🎡 Play roulette with various bet types',
  options: ['straight', 'split', 'color', 'even_odd', 'dozen', 'column', 'low_high'],
  async execute(message, args) {
    const user = message.author;
    
    // Cooldown check
    if (cooldown.has(user.id)) {
      const remaining = Date.now() - cooldown.get(user.id);
      if (remaining < 20000) {
        return message.reply(`⏳ Please wait ${Math.ceil((20000 - remaining) / 1000)}s before playing again!`);
      }
    }

    // Validate input
    const [betType, betValue, betAmount] = args;
    const bet = parseInt(betAmount);
    
    if (!this.options.includes(betType) || !betValue || isNaN(bet) || bet <= 0) {
      return message.reply('❌ Invalid bet! Usage: `!roulette <bet-type> <bet-value> <amount>`');
    }

    // Check balance
    const userData = await Economy.findOne({ userId: user.id });
    if (!userData || userData.balance < bet) {
      return message.reply(`❌ You need at least ${bet} lumis to play!`);
    }

    // Start game
    this.spinWheel(message, user, userData, betType, betValue, bet);
  },

  async spinWheel(message, user, userData, betType, betValue, bet) {
    // Initial embed
    const spinEmbed = new EmbedBuilder()
      .setColor('#008000')
      .setTitle(`${user.username}'s Roulette`)
      .setDescription("🌀 Spinning wheel...")
      .addFields(
        { name: '🎯 Bet Type', value: betType, inline: true },
        { name: '💰 Bet Amount', value: `\`${bet}\` lumis`, inline: true },
        { name: '🏦 Balance', value: `\`${userData.balance}\` lumis`, inline: true }
      );

    const msg = await message.channel.send({ embeds: [spinEmbed] });

    // Animated spin effect
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
      spinEmbed.setDescription(`🌀 Spinning wheel...\nCurrent: ${WHEEL_NUMBERS[randomIndex].color} ${WHEEL_NUMBERS[randomIndex].number}`);
      await msg.edit({ embeds: [spinEmbed] });
    }

    // Final result
    const result = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
    const win = this.checkWin(betType, betValue, result);
    const payout = win ? Math.floor(bet * PAYOUTS[betType]) : -bet;

    // Update balance
    userData.balance += payout;
    await userData.save();

    // Result embed
    const resultEmbed = new EmbedBuilder()
      .setColor(win ? '#00FF00' : '#FF0000')
      .setTitle(win ? '🎉 WINNER! 🎉' : '💥 BUSTED! 💥')
      .setDescription(`**The ball landed on:**\n${result.color} **${result.number}**`)
      .addFields(
        { name: '🎯 Bet Type', value: betType, inline: true },
        { name: '💰 Payout', value: `\`${payout >= 0 ? '+' : '-'}${Math.abs(payout)}\` lumis`, inline: true },
        { name: '🏦 New Balance', value: `\`${userData.balance}\` lumis`, inline: false }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('play_again')
        .setLabel('🔄 Play Again')
        .setStyle(ButtonStyle.Primary)
    );

    await msg.edit({ embeds: [resultEmbed], components: [row] });

    // Button handler
    const filter = i => i.customId === 'play_again' && i.user.id === user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 20000 });

    collector.on('collect', async i => {
      if (userData.balance < bet) {
        return i.reply({ content: "❌ You don't have enough lumis to play again!", ephemeral: true });
      }
      await i.deferUpdate();
      this.spinWheel(message, user, userData, betType, betValue, bet);
    });

    collector.on('end', () => msg.edit({ components: [] }));
    cooldown.set(user.id, Date.now());
    setTimeout(() => cooldown.delete(user.id), 20000);
  },

  checkWin(betType, betValue, result) {
    const num = result.number;
    switch(betType) {
      case 'straight':
        return num === parseInt(betValue);
      case 'split':
        const [n1, n2] = betValue.split('-').map(Number);
        return num === n1 || num === n2;
      case 'color':
        return result.color === (betValue === 'red' ? '🔴' : '⚫️');
      case 'even_odd':
        return num !== 0 && (num % 2 === 0) === (betValue === 'even');
      case 'dozen':
        const dozen = parseInt(betValue);
        return dozen === 1 ? num <= 12 : dozen === 2 ? num > 12 && num <= 24 : num > 24;
      case 'column':
        const col = parseInt(betValue);
        return num !== 0 && (num % 3) === (col === 1 ? 1 : col === 2 ? 2 : 0);
      case 'low_high':
        return num !== 0 && (betValue === 'low' ? num <= 18 : num > 18);
      default:
        return false;
    }
  }
};