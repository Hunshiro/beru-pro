const { PermissionsBitField } = require('discord.js');
const mongoose = require('mongoose');

let Milestone = null;

module.exports = {
    name: 'addgoal',
    description: 'Set or update the member milestone goal (admin only)',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                await message.reply('Only administrators can set the milestone goal.');
                return;
            }

            if (!args.length) {
                await message.reply('Please provide a goal (e.g., !addgoal 20k).');
                return;
            }

            // Load Milestone model dynamically
            if (!Milestone) {
                try {
                    Milestone = require('../../models/milestone');
                    console.log('Milestone model loaded successfully for addgoal.');
                } catch (err) {
                    console.error('Failed to load Milestone model:', err);
                    await message.reply('Error: Milestone model not found. Please ensure the model file exists and Mongoose is connected.');
                    return;
                }
            }

            // Check Mongoose connection
            if (mongoose.connection.readyState !== 1) {
                console.error('Mongoose is not connected.');
                await message.reply('Error: Database not connected. Please ensure Mongoose is set up.');
                return;
            }

            const goalStr = args[0].toLowerCase();
            let goal = parseInt(goalStr.replace('k', '000'));
            if (isNaN(goal) || goal <= 0) {
                await message.reply('Invalid goal. Use a number (e.g., 20k for 20,000).');
                return;
            }

            await Milestone.findOneAndUpdate(
                { guildId: message.guild.id },
                { $set: { goal: goal } },
                { upsert: true }
            );
            await message.reply(`Milestone goal set to ${Math.floor(goal / 1000)}K members.`);
        } catch (error) {
            console.error('Addgoal command error:', error);
            await message.reply('❌ Error setting milestone goal. Please try again later.').catch(console.error);
        }
    },
};