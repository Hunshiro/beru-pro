const { PermissionsBitField } = require('discord.js');
const shutupCommand = require('./shutup');

module.exports = {
  name: 'unshutup',
  description: 'Unsilences a previously muted user (admin only)',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("You don't have permission to use this command.");
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply('Please mention a user to unmute.');

    if (!shutupCommand.isMuted(target.id)) {
      return message.reply(`${target} is not muted.`);
    }

    shutupCommand.unmute(target.id);
    message.channel.send(`${target} is now free to speak.`);
  }
};
