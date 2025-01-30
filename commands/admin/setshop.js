const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const ShopItem = require('../../models/shop');

module.exports = {
  name: 'setshop',
  description: 'Interactively add roles and prices to the shop.',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('You do not have permission to use this command.');
    }

    let rolesToAdd = [];

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('SetShop: Role and Price Setup')
      .setDescription('Please use the format: `@role <price>`. Type `stop` to finish.');

    const setupMessage = await message.channel.send({ embeds: [embed] });

    const filter = response => response.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 60000 });

    collector.on('collect', async (response) => {
      const input = response.content.trim();

      if (input.toLowerCase() === 'stop') {
        collector.stop();
        if (rolesToAdd.length > 0) {
          try {
            await ShopItem.insertMany(rolesToAdd);
            await response.reply(`Successfully added ${rolesToAdd.length} roles to the shop!`);
          } catch (error) {
            console.error(error);
            await response.reply('There was an error adding the roles to the shop.');
          }
        } else {
          await response.reply('No roles were added to the shop.');
        }
        return;
      }

      // Get role from the response's mentions, not original message
      const role = response.mentions.roles.first();
      const price = input.split(/\s+/).slice(1).find(arg => !isNaN(arg));

      if (!role) {
        return response.reply('**Error:** Please mention a valid role first. Format: `@role <price>`');
      }

      if (!price || isNaN(price) || parseInt(price) <= 0) {
        return response.reply('**Error:** Please provide a valid positive number for the price.');
      }

      try {
        const existingItem = await ShopItem.findOne({ roleId: role.id });
        if (existingItem) {
          return response.reply(`**Error:** ${role.name} is already in the shop.`);
        }

        rolesToAdd.push({
          roleName: role.name,
          price: parseInt(price),
          roleId: role.id
        });

        await response.reply(`✅ Added **${role.name}** for **${price} lumis**\nContinue adding or type \`stop\` to finish.`);
      } catch (error) {
        console.error(error);
        await response.reply('There was an error processing your request.');
      }
    });

    collector.on('end', async (collected, reason) => {
      try {
        await setupMessage.delete();
      } catch (error) {
        console.error('Error deleting setup message:', error);
      }
      
      if (reason === 'time') {
        await message.channel.send('⏰ Setup timed out after 60 seconds of inactivity.');
      }
    });
  }
};