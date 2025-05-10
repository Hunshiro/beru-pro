const { EmbedBuilder } = require('discord.js');
const { LevelRole } = require('../../models/level');

module.exports = {
    name: 'resetlevelup',
    description: 'Change a specific levelup role or reset all levelup roles (admin only)',
    async execute(message) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('You need administrator permissions to use this command.');
        }

        try {
            // Initial prompt
            const promptEmbed = new EmbedBuilder()
                .setTitle('Reset Level Roles')
                .setDescription('Type `1` to change a specific levelup role, or `2` to reset all levelup roles. Type `cancel` to abort.')
                .setColor('#FF6666')
                .setFooter({ text: 'You have 2 minutes to respond.' });

            await message.reply({ embeds: [promptEmbed] });

            const filter = m => m.author.id === message.author.id;
            const collector = message.channel.createMessageCollector({ filter, time: 120000 });

            collector.on('collect', async m => {
                const content = m.content.toLowerCase();

                if (content === 'cancel') {
                    collector.stop('cancel');
                    return;
                }

                if (content === '1') {
                    collector.stop('change');
                    // Change specific levelup role
                    await changeSpecificRole(message);
                } else if (content === '2') {
                    collector.stop('reset');
                    // Reset all levelup roles
                    await resetAllRoles(message);
                } else {
                    await m.reply('Invalid option. Please type `1`, `2`, or `cancel`.');
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    message.channel.send('⏰ Reset level roles timed out.');
                }
            });
        } catch (error) {
            console.error('Reset levelup error:', error);
            await message.reply('There was an error starting the reset level roles process.');
        }
    },
};

async function changeSpecificRole(message) {
    const filter = m => m.author.id === message.author.id;
    const channel = message.channel;

    try {
        await channel.send('Please provide the level number you want to change. Type `cancel` to abort.');

        const levelCollector = channel.createMessageCollector({ filter, time: 120000, max: 1 });
        levelCollector.on('collect', async m => {
            if (m.content.toLowerCase() === 'cancel') {
                return channel.send('Operation cancelled.');
            }

            const level = parseInt(m.content);
            if (isNaN(level) || level < 1) {
                return channel.send('Invalid level number. Operation cancelled.');
            }

            await channel.send('Please mention the new role or provide the exact role name. Type `cancel` to abort.');

            const roleCollector = channel.createMessageCollector({ filter, time: 120000, max: 1 });
            roleCollector.on('collect', async rm => {
                if (rm.content.toLowerCase() === 'cancel') {
                    return channel.send('Operation cancelled.');
                }

                const role = rm.mentions.roles.first() || message.guild.roles.cache.find(r => r.name === rm.content);
                if (!role) {
                    return channel.send('Role not found. Operation cancelled.');
                }

                try {
                    await LevelRole.findOneAndUpdate(
                        { guildId: message.guild.id, level },
                        { guildId: message.guild.id, level, roleId: role.id },
                        { upsert: true, new: true }
                    );
                    await channel.send(`✅ Level role for level ${level} has been updated to ${role.name}.`);
                } catch (error) {
                    console.error('Error updating level role:', error);
                    await channel.send('There was an error updating the level role.');
                }
            });
        });
    } catch (error) {
        console.error('Error in changeSpecificRole:', error);
        await channel.send('There was an error during the process.');
    }
}

async function resetAllRoles(message) {
    try {
        await LevelRole.deleteMany({ guildId: message.guild.id });
        await message.channel.send('✅ All levelup roles have been reset.');
    } catch (error) {
        console.error('Error resetting level roles:', error);
        await message.channel.send('There was an error resetting the level roles.');
    }
}
