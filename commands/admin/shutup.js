const { PermissionsBitField } = require('discord.js');

// Store muted user IDs
const mutedUsers = new Set();

module.exports = {
  name: 'shutup',
  description: 'Silences a user by deleting their messages instantly (admin only)',
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("You don't have permission to use this command.");
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply('Please mention a user to silence.');

    mutedUsers.add(target.id);
    message.channel.send(`${target} has been told to shut up. Their messages will be deleted instantly.`);

    // Listen for target's messages and delete them
    const filter = (msg) => msg.author.id === target.id;
    const collector = message.channel.createMessageCollector({ filter });

    collector.on('collect', (msg) => {
      msg.delete().catch(() => {});
    });
  },
  isMuted(userId) {
    return mutedUsers.has(userId);
  }
};
