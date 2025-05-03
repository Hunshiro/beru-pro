const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const Welcome = require('../../models/welcome'); // MongoDB model for storing welcome messages

module.exports = {
  name: 'setwelcome',
  description: 'Set custom welcome messages and channel.',
  async execute(message) {
    // Check if the user has admin permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('You do not have permission to use this command.');
    }

    const filter = (response) => response.author.id === message.author.id;

    // Ask for the server channel name
    await message.reply('Please provide the **server channel name** where welcome messages should be sent (e.g., #welcome):');
    const channelNameResponse = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time'],
    });
    const channelName = channelNameResponse.first().content.trim();

    // Ask for the server welcome message
    await message.reply('Please provide the **server welcome message** (use `{user}` to mention the new member):');
    const serverMessageResponse = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time'],
    });
    const serverMessage = serverMessageResponse.first().content;

    // Ask for the DM welcome message
    await message.reply('Please provide the **DM welcome message** (use `{user}` to mention the new member, or type `none` to disable):');
    const dmMessageResponse = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time'],
    });
    const dmMessageRaw = dmMessageResponse.first().content.toLowerCase();
    const dmMessage = dmMessageRaw === 'none' ? null : dmMessageResponse.first().content;

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
        channelName,
        serverMessage,
        dmMessage,
        dmLinks,
      },
      { upsert: true, new: true }
    );

    // Confirmation message
    const embed = new EmbedBuilder()
      .setTitle('Welcome Message Configured ✅')
      .setColor('#00FF00')
      .setDescription('Your welcome messages and channel have been successfully saved.')
      .addFields(
        { name: 'Server Channel', value: channelName, inline: false },
        { name: 'Server Message', value: serverMessage, inline: false },
        { name: 'DM Message', value: dmMessage || 'Disabled', inline: false },
        { name: 'DM Links', value: dmLinks || 'Not Set', inline: false }
      );

    message.reply({ embeds: [embed] });
  },
};
