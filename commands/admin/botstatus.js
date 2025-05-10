module.exports = {
    name: 'botstatus',
    description: 'Set the bot status (admin only)',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('You need administrator permissions to use this command.');
        }

        const status = args.join(' ');
        if (!status) {
            return message.reply('Please provide a status to set.');
        }

        try {
            await message.client.user.setActivity(status);
            await message.reply(`Bot status has been set to: ${status}`);
        } catch (error) {
            console.error('Error setting bot status:', error);
            await message.reply('There was an error setting the bot status.');
        }
    },
};
