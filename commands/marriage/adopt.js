const { Children } = require('../../models/children');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'adopt',
    description: 'Adopt a child',
    async execute(message, args) {
        try {
            const adopter = message.author;
            const targetUser = message.mentions.users.first();

            // Check if a user was mentioned
            if (!targetUser) {
                return message.reply('Please mention the user you want to adopt! Usage: `/adopt @user`');
            }

            // Prevent self-adoption
            if (targetUser.id === adopter.id) {
                return message.reply('You cannot adopt yourself! 🤨');
            }

            // Check if the user has adopted 4 children
            const adoptedChildren = await Children.find({ parent: adopter.id });
            if (adoptedChildren.length >= 4) {
                return message.reply('You already have 4 children! That\'s quite a handful already! 👨‍👩‍👧‍👦');
            }

            // Check if the target user is already adopted
            const existingChild = await Children.findOne({ child_id: targetUser.id });
            if (existingChild) {
                return message.reply('This user has already been adopted! 😅');
            }

            // Create buttons
            const acceptButton = new ButtonBuilder()
                .setCustomId('accept_adoption')
                .setLabel('Accept Adoption')
                .setStyle('Success')
                .setEmoji('🤗');

            const declineButton = new ButtonBuilder()
                .setCustomId('decline_adoption')
                .setLabel('Decline')
                .setStyle('Danger')
                .setEmoji('😔');

            const row = new ActionRowBuilder()
                .addComponents(acceptButton, declineButton);

            // Create embed
            const adoptionEmbed = new EmbedBuilder()
                .setTitle('✨ New Adoption Request! ✨')
                .setDescription(`${targetUser}, ${adopter} wants to adopt you!\n\nWhat do you say? 🎀`)
                .setColor('#FF69B4')
                .setThumbnail(adopter.displayAvatarURL())
                .addFields(
                    { name: '❤️ Potential Parent', value: adopter.tag, inline: true },
                    { name: '👶 Potential Child', value: targetUser.tag, inline: true }
                )
                .setFooter({ text: 'This request will expire in 2 minutes' });

            // Send the adoption request
            const adoptionMessage = await message.channel.send({
                content: `${targetUser}`,
                embeds: [adoptionEmbed],
                components: [row]
            });

            // Create button collector
            const collector = adoptionMessage.createMessageComponentCollector({
                time: 120000 // 2 minutes
            });

            collector.on('collect', async interaction => {
                // Ensure only the target user can interact with buttons
                if (interaction.user.id !== targetUser.id) {
                    return interaction.reply({
                        content: 'Only the potential adoptee can respond to this request!',
                        ephemeral: true
                    });
                }

                if (interaction.customId === 'accept_adoption') {
                    // Create new adoption record
                    const newChild = new Children({
                        parent: adopter.id,
                        child_id: targetUser.id,
                        child_name: targetUser.username,
                        adoption_date: new Date(),
                    });

                    await newChild.save();

                    const successEmbed = new EmbedBuilder()
                        .setTitle('🎉 Adoption Successful! 🎉')
                        .setDescription(`${adopter} has officially adopted ${targetUser}!\nCongratulations to the new family! 🎊`)
                        .setColor('#00FF00')
                        .setTimestamp();

                    await interaction.update({
                        embeds: [successEmbed],
                        components: []
                    });
                } else if (interaction.customId === 'decline_adoption') {
                    const declineEmbed = new EmbedBuilder()
                        .setTitle('Adoption Declined 💔')
                        .setDescription(`${targetUser} has declined the adoption request.`)
                        .setColor('#FF0000')
                        .setTimestamp();

                    await interaction.update({
                        embeds: [declineEmbed],
                        components: []
                    });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('Adoption Request Expired ⌛')
                        .setDescription('The adoption request has expired without a response.')
                        .setColor('#808080')
                        .setTimestamp();

                    adoptionMessage.edit({
                        embeds: [timeoutEmbed],
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('Error in adopt command:', error);
            message.reply('There was an error processing the adoption request! Please try again later.');
        }
    },
};