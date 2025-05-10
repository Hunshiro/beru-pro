const ServerSettings = require('../../models/serverSettings');

module.exports = {
    name: 'setxpreward',
    description: 'Set or edit server XP reward and cooldown time (admin only)',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('You need administrator permissions to use this command.');
        }

        if (args.length < 2) {
            return message.reply('Usage: !setxpreward <xpReward> <cooldownSeconds>');
        }

        const xpReward = parseInt(args[0]);
        const cooldownSeconds = parseInt(args[1]);

        if (isNaN(xpReward) || xpReward < 1) {
            return message.reply('Please provide a valid XP reward value (positive integer).');
        }

        if (isNaN(cooldownSeconds) || cooldownSeconds < 1) {
            return message.reply('Please provide a valid cooldown time in seconds (positive integer).');
        }

        try {
            const updatedSettings = await ServerSettings.findOneAndUpdate(
                { guildId: message.guild.id },
                { guildId: message.guild.id, xpReward, cooldownSeconds },
                { upsert: true, new: true }
            );

            await message.reply(`Server XP reward set to ${xpReward} XP and cooldown time set to ${cooldownSeconds} seconds.`);
        } catch (error) {
            console.error('Error setting server XP reward:', error);
            await message.reply('There was an error setting the server XP reward.');
        }
    },
};
