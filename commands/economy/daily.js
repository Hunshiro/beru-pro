const { EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy'); // Assuming this is the correct path to the economy model
const ms = require('ms'); // To handle time formatting

module.exports = {
  name: 'daily',
  description: 'Claim your daily bonus!',
  async execute(message) {
    const userId = message.author.id;
    const userEconomy = await Economy.findOne({ userId });

    // Check if the user exists in the economy database
    if (!userEconomy) {
      // If not, create a new entry with default values
      await Economy.create({
        userId,
        balance: 0,
        lastDaily: 0,
        streak: 0,
      });
    }

    const now = Date.now();
    const cooldown = 86400000; // 24 hours in milliseconds

    // Check if the user can claim their daily bonus
    if (userEconomy.lastDaily + cooldown > now) {
      const timeLeft = userEconomy.lastDaily + cooldown - now;
      return message.channel.send(`You have already claimed your daily bonus! Please wait ${ms(timeLeft)} before claiming again.`);
    }

    // Grant the daily bonus (e.g., 100 coins)
    const bonus = 100;
    userEconomy.balance += bonus;
    userEconomy.lastDaily = now; // Update the last claimed time

    // Update streak logic
    const lastClaimDate = new Date(userEconomy.lastDaily);
    const lastStreakDate = new Date(now - cooldown);
    
    if (lastClaimDate.toDateString() === lastStreakDate.toDateString()) {
      userEconomy.streak += 1; // Increment streak if claimed on consecutive days
    } else {
      userEconomy.streak = 1; // Reset streak if not claimed on consecutive days
    }

    await userEconomy.save();

    const embed = new EmbedBuilder()
      .setColor('#FFD700') // Gold color for a more eye-catching look
      .setTitle('🎉 Daily Bonus Claimed! 🎉')
      .setDescription(`Congratulations! You've received **${bonus} lumis**! 💰\nYour new balance is **${userEconomy.balance} coins**. Keep it up!`)
      .addFields(
        { name: 'Streak', value: `You have a streak of **${userEconomy.streak} days**!`, inline: true },
        { name: 'Last Claimed', value: `<t:${Math.floor(userEconomy.lastDaily / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Remember to claim your daily bonus every 24 hours!' });

    message.channel.send({ embeds: [embed] });
  },
};
