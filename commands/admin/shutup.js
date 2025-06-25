const { PermissionsBitField } = require('discord.js');

const mutedUsers = new Set();
const messageListeners = new Map();

module.exports = {
  name: 'shutup',
  description: 'Silences a user by deleting their messages instantly (admin only)',

  execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("You don't have permission to use this command.");
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply('Please mention a user to silence.');

    if (mutedUsers.has(target.id)) {
      return message.reply(`${target} is already muted.`);
    }

    mutedUsers.add(target.id);

    const listener = (msg) => {
      if (msg.author.id === target.id) {
        msg.delete().catch(() => {});
      }
    };

    client.on('messageCreate', listener);
    messageListeners.set(target.id, listener);

    message.channel.send(`${target} has been silenced. Their messages will be deleted.`);
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
