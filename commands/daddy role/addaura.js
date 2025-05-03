const { EmbedBuilder } = require('discord.js');
const User = require('../../models/user');

module.exports = {
  name: 'addaura',
  description: 'Give 1 aura point to a registered league user (Max 3 per day)',
  async execute(message, args) {
    const daddyRole = message.guild.roles.cache.find(r => r.name === 'RC Daddy');
    if (!message.member.roles.cache.has(daddyRole?.id)) {
      return message.reply("You need the **RC Daddy** role to use this.");
    }

    const receiverId = args[0]?.replace(/[<@!>]/g, '');
    if (!receiverId) return message.reply("Usage: `!addaura <userID or mention>`");

    const giverId = message.author.id;
    const today = new Date().toISOString().slice(0, 10);

    const [giver, receiver, receiverMember] = await Promise.all([
      User.findOne({ userId: giverId }),
      User.findOne({ userId: receiverId }),
      message.guild.members.fetch(receiverId).catch(() => null)
    ]);

    if (!receiverMember) {
      return message.reply("The user is not found in this server.");
    }

    if (receiverMember.roles.cache.has(daddyRole.id)) {
      return message.reply("You can't give aura points to another RC Daddy.");
    }

    if (!receiver || !receiver.registered) {
      return message.reply("The user is not registered in the league.");
    }

    if (!giver) {
      return message.reply("You must be tracked in the system. Type `!register` once.");
    }

    if (giver.lastVoteDate !== today) {
      giver.lastVoteDate = today;
      giver.pointsGiven = 0;
    }

    if (giver.pointsGiven >= 10) {
      return message.reply("You’ve already used your 10 aura points for today.");
    }

    // Give aura
    giver.pointsGiven++;
    receiver.points += 1;
    await Promise.all([giver.save(), receiver.save()]);

    // Build aura embed
    const embed = new EmbedBuilder()
      .setTitle("💫 Aura Blessed!")
      .setColor('#9e5eff')
      .setThumbnail(receiverMember.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**<@${receiverId}>** has received ` +
                      `✨ **1 Aura Point** from Daddy <@${giverId}>!`)
      .addFields(
        { name: 'Total Aura', value: `${receiver.points} points`, inline: true },
        { name: 'Aura Given Today', value: `${giver.pointsGiven}/10`, inline: true }
      )
      .setFooter({ text: 'Aura flows where respect goes 💜' })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
