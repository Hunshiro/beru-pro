const { Level } = require('../../models/level');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'mute_level_notifications') {
            try {
                let levelData = await Level.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
                if (!levelData) {
                    levelData = new Level({ userId: interaction.user.id, guildId: interaction.guild.id, xp: 0, level: 0 });
                }

                levelData.notifications = false;
                await levelData.save();

                await interaction.reply({ content: 'Level-up notifications have been muted.', ephemeral: true });
            } catch (error) {
                console.error('Mute notifications error:', error);
                await interaction.reply({ content: 'There was an error muting notifications.', ephemeral: true });
            }
        }
    },
};