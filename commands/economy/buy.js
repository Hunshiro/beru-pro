
const { EmbedBuilder } = require('discord.js');
const Economy = require('../../models/economy');
const ShopItem = require('../../models/shop');
module.exports = {
    name: 'buy',
    description: 'Purchase a role from the shop',
    async execute(message, args) {
        try {
            if (!message.client.shopTokens) {
                return message.reply('Please view the shop first using `!shop`');
            }

            const token = args[0];
            if (!token || !message.client.shopTokens.has(token)) {
                return message.reply('Invalid token. Please check the shop and try again.');
            }

            const { roleId, price } = message.client.shopTokens.get(token);

            // Check user's balance
            const userEconomy = await Economy.findOne({ userId: message.author.id });
            if (!userEconomy || userEconomy.lumis < price) {
                return message.reply('You do not have enough lumis to purchase this role.');
            }

            // Check if role exists
            const role = message.guild.roles.cache.get(roleId);
            if (!role) {
                return message.reply('The role associated with this token is not available.');
            }

            try {
                // Find all shop roles the user currently has
                const shopItems = await ShopItem.find({});
                const shopRoleIds = shopItems.map(item => item.roleId);
                const userShopRoles = message.member.roles.cache.filter(role => shopRoleIds.includes(role.id));

                // Remove all existing shop roles
                if (userShopRoles.size > 0) {
                    await message.member.roles.remove(userShopRoles);
                    await message.channel.send({
                        content: `Removed role: **${userShopRoles.map(role => role.name).join(', ')}**`,
                        ephemeral: true
                    });
                }

                // Deduct lumis and save
                userEconomy.lumis -= price;
                await userEconomy.save();

                // Add new role
                await message.member.roles.add(role);
                
                // Send success message
                return message.reply({
                    content: `Successfully purchased the **${role.name}** role for **${price}** lumis!${
                        userShopRoles.size > 0 ? '\nYour previous shop role(s) have been removed.' : ''
                    }`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Buy error:', error);
                // If there's an error, attempt to rollback any changes
                if (userEconomy.lumis !== undefined) {
                    userEconomy.lumis += price; // Restore lumis if they were deducted
                    await userEconomy.save().catch(console.error);
                }
                return message.reply('Failed to process the purchase. Please try again later.');
            }

        } catch (error) {
            console.error('Buy command error:', error);
            return message.reply('An error occurred while processing your purchase.');
        }
    }
};