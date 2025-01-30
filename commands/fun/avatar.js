const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  description: '🖼️ Fetch the profile image of the mentioned user!',

  async execute(message, args) {
    try {
      // Get the user mentioned or default to the message author
      const target = message.mentions.users.first() || message.author;

      // Create an embed with the user's avatar
      const avatarEmbed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle(`${target.username}'s Avatar`)
        .setImage(target.displayAvatarURL({ dynamic: true, size: 512 }))
        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      // Send the embed
      await message.channel.send({ embeds: [avatarEmbed] });
    } catch (error) {
      console.error('Error in avatar command:', error);
      message.reply('❌ An error occurred while fetching the avatar. Please try again!');
    }
  }
};
