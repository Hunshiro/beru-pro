const { EmbedBuilder } = require('discord.js');
const User = require('../../models/user');

module.exports = {
  name: 'register',
  description: 'Register for the Daddy Role League',
  async execute(message) {
    const userId = message.author.id;

    const existing = await User.findOne({ userId });

    if (existing && existing.registered) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('📛 Already Registered')
            .setDescription("You're already part of the **Daddy Role League**!")
            .setFooter({ text: 'One of us... One of us...' })
            .setTimestamp()
        ]
      });
    }

    if (!existing) {
      await new User({
        userId,
        registered: true,
        points: 0,
        pointsGiven: 0,
        lastVoteDate: null
      }).save();
    } else {
      existing.registered = true;
      await existing.save();
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Registration Complete!')
      .setColor('#9e5eff')
      .setDescription(`Welcome to the **Daddy Role League**, <@${userId}>!`)
      .addFields(
        { name: 'Aura Starts At', value: '0 points 💫', inline: true },
        { name: 'How to Gain Points', value: 'Get blessed by a **RC Daddy** using `!addaura`', inline: true }
      )
      .setFooter({ text: 'Let the aura journey begin 💜' })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
