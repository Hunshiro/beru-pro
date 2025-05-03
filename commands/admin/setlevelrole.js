const { EmbedBuilder } = require('discord.js');
const { LevelRole } = require('../../models/level');

module.exports = {
    name: 'setlevelrole',
    description: 'Interactively set roles for specific levels (admin only)',
    async execute(message) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('You need administrator permissions to use this command.');
        }

        try {
            // Initial prompt
            const promptEmbed = new EmbedBuilder()
                .setTitle('Set Level Roles')
                .setDescription('Please provide a level and role in the format: `level @role` (e.g., `5 @Elite`). Type `cancel` to finish.')
                .setColor('#66BFBF')
                .setFooter({ text: 'You have 2 minutes to respond.' });

            await message.reply({ embeds: [promptEmbed] });

            // Create a message collector
            const filter = m => m.author.id === message.author.id;
            const collector = message.channel.createMessageCollector({ filter, time: 120000 }); // 2 minutes

            const newLevelRoles = []; // Store new level-role pairs for this session

            collector.on('collect', async m => {
                if (m.content.toLowerCase() === 'cancel') {
                    collector.stop('cancel');
                    return;
                }

                const args = m.content.trim().split(/\s+/);
                const level = parseInt(args[0]);
                const role = m.mentions.roles.first() || message.guild.roles.cache.find(r => r.name === args.slice(1).join(' '));

                if (isNaN(level) || level < 1) {
                    await m.reply('Please provide a valid level (e.g., `5 @Elite`).');
                    return;
                }

                if (!role) {
                    await m.reply('Please mention a valid role (e.g., `5 @Elite`).');
                    return;
                }

                try {
                    // Save or update the level-role pair
                    await LevelRole.findOneAndUpdate(
                        { guildId: message.guild.id, level },
                        { guildId: message.guild.id, level, roleId: role.id },
                        { upsert: true, new: true }
                    );

                    newLevelRoles.push({ level, roleName: role.name, roleId: role.id });
                    await m.reply(`✅ Added role **${role.name}** for level **${level}**. Provide another level and role, or type **cancel**  to finish.`);
                } catch (error) {
                    console.error('Set level role error:', error);
                    await m.reply('There was an error setting the level role. Please try again.');
                }
            });

            collector.on('end', async (collected, reason) => {
                // Fetch all level roles for the guild
                const allLevelRoles = await LevelRole.find({ guildId: message.guild.id }).sort({ level: 1 });

                // Create result embed
                const resultEmbed = new EmbedBuilder()
                    .setTitle('Level Roles Configuration')
                    .setColor('#66BFBF')
                    .setTimestamp();

                if (newLevelRoles.length > 0) {
                    resultEmbed.addFields({
                        name: 'Newly Added Roles',
                        value: newLevelRoles.map(r => `Level **${r.level}**: <@&${r.roleId}>`).join('\n') || 'None',
                    });
                }

                resultEmbed.addFields({
                    name: 'All Level Roles',
                    value: allLevelRoles.length > 0
                        ? allLevelRoles.map(r => `Level **${r.level}**: <@&${r.roleId}>`).join('\n')
                        : 'No level roles set.',
                });

                if (reason === 'time') {
                    resultEmbed.setDescription('⏰ Setup timed out. Here are the level roles configured so far.');
                } else {
                    resultEmbed.setDescription('✅ Setup complete! Here are the level roles configured.');
                }

                await message.channel.send({ embeds: [resultEmbed] });
            });
        } catch (error) {
            console.error('Set level role error:', error);
            await message.reply('There was an error starting the level role setup.');
        }
    },
};