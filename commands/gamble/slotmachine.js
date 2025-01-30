const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Economy = require('../../models/economy');
const cooldown = new Map();

// Enhanced slot configuration with better odds
const SLOT_SYMBOLS = {
    '💎': { name: 'Diamond', payout: 20, rarity: 10 },
    '7️⃣': { name: 'Seven', payout: 15, rarity: 15 },
    '🎰': { name: 'Jackpot', payout: 12, rarity: 20 },
    '🔔': { name: 'Bell', payout: 10, rarity: 25 },
    '🍇': { name: 'Grapes', payout: 6, rarity: 30 },
    '🍊': { name: 'Orange', payout: 4, rarity: 35 },
    '🍒': { name: 'Cherry', payout: 2, rarity: 40 },
  };

// Calculate total rarity for probability distribution
const TOTAL_RARITY = Object.values(SLOT_SYMBOLS).reduce((sum, symbol) => sum + symbol.rarity, 0);

// Single row animation frames
const REEL_ANIMATIONS = ['⬛', '⬜', '⬛'];

module.exports = {
  name: 'slot',
  description: '🎰 Play the Lucky Casino Slots!',
  
  async execute(message, args) {
    try {
      const user = message.author;
      
      // Enhanced bet validation with minimum and maximum limits
      const minBet = 10;
      const maxBet = 1000;
      const bet = parseInt(args[0]);
      
      if (!bet || isNaN(bet) || bet < minBet || bet > maxBet) {
        return message.reply(`❌ Please bet between ${minBet} and ${maxBet} lumis! Usage: \`!slot <amount>\``);
      }

      // Cooldown check with fancy timer display
      if (cooldown.has(user.id)) {
        const remaining = Date.now() - cooldown.get(user.id);
        if (remaining < 15000) {
          const seconds = Math.ceil((15000 - remaining) / 1000);
          return message.reply(`⏳ Reels cooling down! Ready in ${seconds}s\n${'🔵'.repeat(seconds)}${'⚪'.repeat(15-seconds)}`);
        }
      }

      // Get or create user data
      let userData = await Economy.findOne({ userId: user.id });
      if (!userData) {
        userData = new Economy({ userId: user.id, balance: 1000 }); // Starting balance for new users
        await userData.save();
      }

      if (userData.balance < bet) {
        return message.reply(`❌ You need at least ${bet} lumis to play! Current balance: ${userData.balance} lumis`);
      }

      await this.startSlotMachine(message, user, userData, bet);
    } catch (error) {
      console.error('Error in slot command:', error);
      message.reply('❌ An error occurred while processing your bet. Please try again!');
    }
  },

  async startSlotMachine(message, user, userData, bet) {
    try {
      // Initial casino atmosphere embed
      const casinoEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎰 Lucky Casino Slots 🎰')
        .setDescription(this.createSlotMachineArt())
        .addFields(
          { name: '💰 Your Bet', value: `\`${bet}\` lumis`, inline: true },
          { name: '🏦 Balance', value: `\`${userData.balance}\` lumis`, inline: true },
          { name: '📊 Payouts', value: this.createPayoutTable(), inline: false }
        );

      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('pull_lever')
          .setLabel('🎮 PULL LEVER!')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('double_bet')
          .setLabel('2️⃣ Double Bet')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('half_bet')
          .setLabel('½ Half Bet')
          .setStyle(ButtonStyle.Secondary)
      );

      const msg = await message.channel.send({ 
        embeds: [casinoEmbed], 
        components: [controlRow]
      });

      this.setupInitialCollector(msg, user, userData, bet);
    } catch (error) {
      console.error('Error starting slot machine:', error);
      message.reply('❌ An error occurred while starting the game. Please try again!');
    }
  },

  setupInitialCollector(msg, user, userData, bet) {
    const filter = i => ['pull_lever', 'double_bet', 'half_bet'].includes(i.customId) && i.user.id === user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async i => {
      try {
        switch(i.customId) {
          case 'pull_lever':
            await i.deferUpdate();
            collector.stop();
            await this.spinReels(msg, user, userData, bet);
            break;
          case 'double_bet':
            if (userData.balance >= bet * 2) {
              await i.deferUpdate();
              collector.stop();
              await this.spinReels(msg, user, userData, bet * 2);
            } else {
              await i.reply({ content: "❌ Not enough lumis to double bet!", ephemeral: true });
            }
            break;
          case 'half_bet':
            await i.deferUpdate();
            collector.stop();
            await this.spinReels(msg, user, userData, Math.max(Math.floor(bet / 2), 10));
            break;
        }
      } catch (error) {
        console.error('Error in button interaction:', error);
        await i.reply({ content: '❌ An error occurred. Please try again!', ephemeral: true });
      }
    });

    collector.on('end', () => {
      if (msg.editable) {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  },

  async spinReels(msg, user, userData, bet) {
    try {
      const spinStages = 6;
      const finalReels = this.generateWeightedReels();
      
      // Animated spinning sequence
      for (let stage = 0; stage < spinStages; stage++) {
        const isLastSpin = stage === spinStages - 1;
        const reels = isLastSpin ? finalReels : this.generateRandomReels();
        
        const spinEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle(isLastSpin ? '🎰 Results Coming In! 🎰' : '🎰 Reels Spinning! 🎰')
          .setDescription(this.createSpinningAnimation(reels, stage))
          .addFields(
            { name: '💰 Bet', value: `\`${bet}\` lumis`, inline: true },
            { name: '🎲 Spinning...', value: '`' + '🎲'.repeat(stage + 1) + '`', inline: true }
          );

        await msg.edit({ embeds: [spinEmbed] });
        await new Promise(resolve => setTimeout(resolve, 700));
      }

      // Calculate results with new payout system
      const win = this.checkWin(finalReels);
      const payout = this.calculatePayout(win, bet, userData);
      userData.balance += payout;
      await userData.save();

      const resultEmbed = new EmbedBuilder()
        .setColor(payout > 0 ? '#00FF00' : '#FF0000')
        .setTitle(this.getWinTitle(payout))
        .setDescription(this.createResultDisplay(finalReels, win))
        .addFields(
          { name: '💰 Bet', value: `\`${bet}\` lumis`, inline: true },
          { name: '🎯 Payout', value: `\`${payout >= 0 ? '+' : '-'}${Math.abs(payout)}\` lumis`, inline: true },
          { name: '🏦 New Balance', value: `\`${userData.balance}\` lumis`, inline: true }
        );

      if (win) {
        const streakBonus = this.calculateStreakBonus(userData);
        resultEmbed.addFields({
          name: '🌟 Winning Combination!',
          value: `${finalReels.join(' ')}${streakBonus > 0 ? `\n🔥 Win Streak Bonus: +${(streakBonus * 100).toFixed(0)}%` : ''}`,
          inline: false
        });
      }

      const newControlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('pull_lever')
          .setLabel('🔄 Play Again')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('cashout')
          .setLabel('💰 Cash Out')
          .setStyle(ButtonStyle.Danger)
      );

      await msg.edit({ embeds: [resultEmbed], components: [newControlRow] });
      this.setupResultCollector(msg, user, userData, bet);
      cooldown.set(user.id, Date.now());
    } catch (error) {
      console.error('Error in spinReels:', error);
      msg.edit({ content: '❌ An error occurred while spinning. Please try again!', components: [] });
    }
  },

  setupResultCollector(msg, user, userData, bet) {
    const filter = i => ['pull_lever', 'cashout'].includes(i.customId) && i.user.id === user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async i => {
      try {
        if (i.customId === 'pull_lever') {
          if (userData.balance >= bet) {
            await i.deferUpdate();
            collector.stop();
            await this.spinReels(msg, user, userData, bet);
          } else {
            await i.reply({ content: "❌ Not enough lumis to play again!", ephemeral: true });
          }
        } else if (i.customId === 'cashout') {
          await i.update({ 
            content: `💰 Thanks for playing! You walked away with ${userData.balance} lumis!`,
            components: [] 
          });
          collector.stop();
        }
      } catch (error) {
        console.error('Error in result collector:', error);
        await i.reply({ content: '❌ An error occurred. Please try again!', ephemeral: true });
      }
    });

    collector.on('end', () => {
      if (msg.editable) {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  },

  generateWeightedReels() {
    const reels = [];
    for (let i = 0; i < 3; i++) {
      const roll = Math.random() * TOTAL_RARITY;
      let currentSum = 0;
      
      for (const [symbol, info] of Object.entries(SLOT_SYMBOLS)) {
        currentSum += info.rarity;
        if (roll <= currentSum) {
          reels.push(symbol);
          break;
        }
      }
      
      if (reels.length <= i) {
        reels.push('🍒');
      }
    }

    // Bonus: Small chance to duplicate adjacent symbols
    if (Math.random() < 0.35) {
      const randomIndex = Math.floor(Math.random() * 2);
      reels[randomIndex + 1] = reels[randomIndex];
    }

    return reels;
  },

  generateRandomReels() {
    return Array(3).fill().map(() => Object.keys(SLOT_SYMBOLS)[Math.floor(Math.random() * Object.keys(SLOT_SYMBOLS).length)]);
  },

  createSlotMachineArt() {
    return `
\`\`\`
╔═══ LUCKY SLOTS ═══╗
║  [${REEL_ANIMATIONS.join('][')}]  ║
╚══════════════════╝
\`\`\`
    `;
  },

  createSpinningAnimation(reels, stage) {
    const sparkles = stage % 2 === 0 ? '✨' : '💫';
    return `
${sparkles} **SPINNING** ${sparkles}
\`\`\`
╔═══ LUCKY SLOTS ═══╗
║  [${reels.join('][')}]  ║
╚══════════════════╝
\`\`\`
    `;
  },

  createPayoutTable() {
    return Object.entries(SLOT_SYMBOLS)
      .map(([symbol, info]) => `${symbol} = ${info.payout}x`)
      .join(' | ');
  },

  getWinTitle(payout) {
    if (payout <= 0) return '💥 Better Luck Next Time! 💥';
    if (payout < 100) return '🎉 Winner! 🎉';
    if (payout < 500) return '🌟 Big Win! 🌟';
    return '🔥 JACKPOT! 🔥';
  },

  createResultDisplay(reels, win) {
    const display = this.createSpinningAnimation(reels, 0);
    return win 
      ? `${display}\n🎯 **Winner!** Matching Symbols!`
      : `${display}\n😢 No matches this time...`;
  },

  checkWin(reels) {
    return reels[0] === reels[1] && reels[1] === reels[2] ? reels : null;
  },

  calculateStreakBonus(userData) {
    const streak = userData.winStreak || 0;
    return Math.min(streak * 0.1, 0.5); // Max 50% bonus after 5 wins
  },

  calculatePayout(win, bet, userData) {
    if (!win) {
      userData.winStreak = 0;
      return -bet;
    }

    const symbol = SLOT_SYMBOLS[win[0]];
    const baseMultiplier = symbol?.payout || 1;
    const streakBonus = this.calculateStreakBonus(userData);
    const totalMultiplier = baseMultiplier * (1 + streakBonus);
    
    userData.winStreak = (userData.winStreak || 0) + 1;
    
    let bonusMultiplier = 1;
    const bonusRoll = Math.random();
    if (bonusRoll < 0.01) bonusMultiplier = 3;
    else if (bonusRoll < 0.05) bonusMultiplier = 2;

    return Math.floor((totalMultiplier * bet * bonusMultiplier) - bet);
  }
};