const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const Marriage = require('../../models/marriage');

module.exports = {
    name: 'marry',
    description: 'Propose marriage to another user',
    async execute(message, args) {
        try {
            const proposer = message.author;
            const partner = message.mentions.users.first();

            if (!partner) {
                return message.reply('You need to mention the person you want to marry! Usage: `!marry @user`');
            }

            if (partner.id === proposer.id) {
                return message.reply('You cannot marry yourself! 💔');
            }

            // Check if either user is already married
            const existingMarriage = await Marriage.findOne({
                $or: [
                    { partner: proposer.id },
                    { spouse: proposer.id },
                    { partner: partner.id },
                    { spouse: partner.id }
                ]
            });

            if (existingMarriage) {
                return message.reply('One of you is already married to someone else! 💍');
            }

            // Create accept/reject buttons
            const acceptButton = new ButtonBuilder()
                .setCustomId('accept_proposal')
                .setLabel('Accept')
                .setStyle('Success')
                .setEmoji('💝');

            const rejectButton = new ButtonBuilder()
                .setCustomId('reject_proposal')
                .setLabel('Reject')
                .setStyle('Danger')
                .setEmoji('💔');

            const row = new ActionRowBuilder()
                .addComponents(acceptButton, rejectButton);

            // Create proposal embed
            const proposalEmbed = new EmbedBuilder()
                .setTitle('💍 Marriage Proposal 💍')
                .setDescription(`${partner}, ${proposer} has proposed to you!\nWhat's your answer? 💕`)
                .setColor('#FF69B4')
                .setTimestamp();

            // Send the proposal
            const proposalMsg = await message.channel.send({
                content: `${partner}`,
                embeds: [proposalEmbed],
                components: [row]
            });

            // Create button collector
            const collector = proposalMsg.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async interaction => {
                // Ensure only the proposed partner can interact
                if (interaction.user.id !== partner.id) {
                    return interaction.reply({
                        content: 'Only the proposed partner can respond to this proposal!',
                        ephemeral: true
                    });
                }

                // Remove the buttons
                await proposalMsg.edit({ components: [] });

                if (interaction.customId === 'accept_proposal') {
                    // Create new marriage record
                    const newMarriage = new Marriage({
                        partner: proposer.id,
                        spouse: partner.id,
                        marriage_date: new Date()
                    });

                    await newMarriage.save();

                    // Send success message in chat
                    await message.channel.send({
                        content: `🎊 **Congratulations** 🎊\n${proposer} and ${partner}, you are now married! May your love last forever! 💑`,
                        allowedMentions: { users: [proposer.id, partner.id] }
                    });

                } else if (interaction.customId === 'reject_proposal') {
                    // Send rejection message in chat
                    await message.channel.send({
                        content: `💔 Oh no! ${partner} has rejected ${proposer}'s proposal... Better luck next time! 🥺`,
                        allowedMentions: { users: [proposer.id, partner.id] }
                    });
                }

                await interaction.deferUpdate();
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    message.channel.send({
                        content: `${proposer} ${partner} The marriage proposal has expired without a response... 💔`,
                        allowedMentions: { users: [proposer.id, partner.id] }
                    });
                }
            });

        } catch (error) {
            console.error('Error in marry command:', error);
            message.reply('There was an error processing the marriage proposal! Please try again later.');
        }
    },
};
