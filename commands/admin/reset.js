const { EmbedBuilder } = require('discord.js');
const User = require('../../models/user');  // Assuming your user model is named User

module.exports = {
  name: 'reset',
  description: 'Resets the database for the particular guild (server).',
  async execute(message) {
    // Check if the user has admin permissions
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply({
        content: "You do not have the required permissions to use this command.",
        ephemeral: true
      });
    }

    try {
      // Reset the database for the current guild
      const guildId = message.guild.id;

      // Remove all user data associated with this guild
      await User.deleteMany({ guildId });

      // Send confirmation message to the admin
      const embed = new EmbedBuilder()
        .setTitle('Database Reset')
        .setDescription(`The database for this guild (${message.guild.name}) has been successfully reset.`)
        .setColor('#FF0000')
        .setFooter({ text: 'Admin Command' });

      return message.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      return message.reply({
        content: "An error occurred while resetting the database. Please try again later.",
        ephemeral: true
      });
    }
  },
};
