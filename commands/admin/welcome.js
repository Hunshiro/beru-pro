const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const Welcome = require('../../models/welcome'); // MongoDB model for storing welcome messages

module.exports = {
  name: 'setwelcome',
  description: 'Set a custom DM welcome message and links.',
  async execute(message) {
    // Check if the user has admin permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('You do not have permission to use this command.');
    }

    const filter = (response) => response.author.id === message.author.id;

    // Ask for the DM welcome message
    await message.reply('Please provide the **DM welcome message** (use `{user}` to mention the new member):');
    const dmMessageResponse = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time'],
    });

    const dmMessage = dmMessageResponse.first().content;

    // Ask for the links message (optional)
    await message.reply('Please provide any **links or additional info** to be sent separately in DM (or type `none` if not needed):');
    const linksResponse = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time'],
    });

    const dmLinks = linksResponse.first().content.toLowerCase() === 'none' ? null : linksResponse.first().content;

    // Save to database
    await Welcome.findOneAndUpdate(
      { guildId: message.guild.id },
      {
        guildId: message.guild.id,
        dmMessage,
        dmLinks,
      },
      { upsert: true, new: true }
    );

    // Confirmation message
    const embed = new EmbedBuilder()
      .setTitle('DM Welcome Message Configured ✅')
      .setColor('#00FF00')
      .setDescription('Your DM welcome message has been successfully saved.')
      .addFields(
        { name: 'DM Message', value: dmMessage, inline: false },
        { name: 'DM Links', value: dmLinks || 'Not Set', inline: false }
      );

    message.reply({ embeds: [embed] });
  },
};
