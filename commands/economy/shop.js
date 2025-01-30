const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const ShopItem = require('../../models/shop');

module.exports = {
    name: 'shop',
    description: 'View the server shop',
    async execute(message) {
        try {
            // Create a temporary token store if it doesn't exist
            if (!message.client.shopTokens) {
                message.client.shopTokens = new Map();
            }

            // Fetch and sort items by price in descending order
            const shopItems = await ShopItem.find({}).sort({ price: -1 });
            
            if (shopItems.length === 0) {
                return message.reply('The shop is currently empty!');
            }

            // Clear old tokens and generate new ones
            message.client.shopTokens.clear();

            // Generate tokens for all items
            shopItems.forEach(item => {
                const token = Math.floor(100 + Math.random() * 900).toString();
                message.client.shopTokens.set(token, {
                    roleId: item.roleId,
                    price: item.price
                });
            });

            let currentPage = 0;
            const itemsPerPage = 4;
            const totalPages = Math.ceil(shopItems.length / itemsPerPage);

            // Create embed for current page
            function createEmbed(page) {
                const startIndex = page * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, shopItems.length);
                const currentItems = shopItems.slice(startIndex, endIndex);
                const boticon = message.client.user.displayAvatarURL();

                const embed = new EmbedBuilder()

                    .setColor('#00FF00')
                    .setTitle('🏪 Server Role Shop')
                    .setDescription('Use `!buy <token>` to purchase a role!\n\nAvailable Roles (Sorted by Price):')
                    .setThumbnail(boticon)
                    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

                currentItems.forEach(item => {
                    const token = Array.from(message.client.shopTokens.entries())
                        .find(([_, value]) => value.roleId === item.roleId)?.[0];

                    embed.addFields({
                        name: `💎 ${item.roleName} - ${item.price} lumis`,
                        value: `Token: \`${token}\`\nTo buy, use \`!buy ${token}\`\n―――――――――――――――`,
                        inline: false
                    });
                });

                return embed;
            }

            // Create navigation buttons
            const getButtons = (disabled = false) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀️ Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(disabled || currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next ▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(disabled || currentPage === totalPages - 1)
                );
            };

            // Send initial message
            const shopMessage = await message.channel.send({
                embeds: [createEmbed(currentPage)],
                components: [getButtons()]
            });

            // Create button collector
            const collector = shopMessage.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id,
                time: 300000 // 5 minutes
            });

            collector.on('collect', async interaction => {
                if (interaction.customId === 'prev') {
                    currentPage = Math.max(0, currentPage - 1);
                } else if (interaction.customId === 'next') {
                    currentPage = Math.min(totalPages - 1, currentPage + 1);
                }

                await interaction.update({
                    embeds: [createEmbed(currentPage)],
                    components: [getButtons()]
                });
            });

            collector.on('end', () => {
                shopMessage.edit({ components: [getButtons(true)] });
            });

        } catch (error) {
            console.error('Shop error:', error);
            return message.reply('Failed to load the shop. Please try again later.');
        }
    }
};