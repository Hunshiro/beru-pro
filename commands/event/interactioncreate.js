const { Level } = require('../../models/level');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'mute_level_notifications') {
      try {
        let levelData = await Level.findOne({
          userId: interaction.user.id,
          guildId: interaction.guild.id,
        });

        if (!levelData) {
          levelData = new Level({
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            xp: 0,
            level: 0,
            lastMessage: null,
            notifications: true,
            lastNotifiedLevel: -1,
          });
        }

        // Toggle notifications
        const wasMuted = levelData.notifications === false;
        levelData.notifications = !wasMuted;
        await levelData.save();

        await interaction.reply({
          content: wasMuted
            ? '🔔 Level-up notifications are now **enabled**.'
            : '🔕 Level-up notifications are now **muted**.',
          ephemeral: true,
        });
      } catch (error) {
        console.error('Mute toggle error:', error);
        await interaction.reply({
          content: '⚠️ There was an error toggling notifications.',
          ephemeral: true,
        });
      }
    }
  },
};
