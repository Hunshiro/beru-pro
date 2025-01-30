const { EmbedBuilder} = require('discord.js');
const Marriage = require('../../models/marriage');


module.exports = {
    name: 'divorce',
    description: 'Divorce your spouse',
    async execute(message) {
        const user = message.author; // The user who is sending the command

        // Check if the user is married
        const existingMarriage = await Marriage.findOne({ $or: [{ partner: user.id }, { spouse: user.id }] });

        if (!existingMarriage) {
            return message.reply('You are not married!');
        }

        // Divorce the user
        await Marriage.deleteOne({ $or: [{ partner: user.id }, { spouse: user.id }] });

        // Send confirmation message
        const embed = new EmbedBuilder()
            .setTitle('Divorce Ceremony')
            .setDescription(`${user.username} has divorced their spouse! 😢`)
            .setColor('#FF0000')
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    },
};
