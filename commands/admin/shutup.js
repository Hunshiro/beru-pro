const { PermissionsBitField } = require('discord.js');

const mutedUsers = new Set();
const messageListeners = new Map();

module.exports = {
  name: 'shutup',
  description: 'Silences a user by deleting their messages instantly (admin only)',

  async execute(message, args, client) {
    // Only admin can use
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("You don't have permission to use this command.");
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply('Please mention a user to silence.');

    // Prevent duplicate muting
    if (mutedUsers.has(target.id)) {
      return message.reply(`${target} is already muted.`);
    }

    // Check bot's permissions
    const botMember = await message.guild.members.fetch(client.user.id);
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("I need the 'Manage Messages' permission to delete messages.");
    }

    // Check bot's role is above the target
    const targetMember = await message.guild.members.fetch(target.id);
    if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
      return message.reply("I can't mute this user because their role is higher than mine.");
    }

    mutedUsers.add(target.id);

    const listener = async (msg) => {
      if (msg.author.id === target.id && msg.guild?.id === message.guild.id) {
        try {
          await msg.delete();
        } catch (err) {
          console.warn(`Failed to delete message: ${err.message}`);
        }
      }
    };

    client.on('messageCreate', listener);
    messageListeners.set(target.id, listener);

    message.channel.send(`${target} has been silenced. Their messages will now be deleted.`);
  },

  isMuted(userId) {
    return mutedUsers.has(userId);
  },

  unmute(userId, client) {
    mutedUsers.delete(userId);
    const listener = messageListeners.get(userId);
    if (listener) {
      client.removeListener('messageCreate', listener);
      messageListeners.delete(userId);
    }
  }
};
