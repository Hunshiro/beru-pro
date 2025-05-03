const { Level, LevelRole } = require('../../models/level');

module.exports = {
    name: 'set-xp',
    description: 'Set a user\'s XP (admin only)',
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('You need administrator permissions to use this command.');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('Please mention a user.');

        const xp = parseInt(args[1]);
        if (isNaN(xp) || xp < 0) return message.reply('Please provide a valid XP amount.');

        try {
            let levelData = await Level.findOne({ userId: user.id, guildId: message.guild.id });
            if (!levelData) {
                levelData = new Level({ userId: user.id, guildId: message.guild.id, xp: 0, level: 0 });
            }

            levelData.xp = xp;
            levelData.level = calculateLevel(xp);

            await levelData.save();
            await assignLevelRoles(user, message.guild, levelData.level);

            await message.reply(`Set ${user.username}'s XP to ${xp} (Level ${levelData.level}).`);
        } catch (error) {
            console.error('Set XP error:', error);
            await message.reply('There was an error setting the XP.');
        }
    },
};

function calculateLevel(xp) {
    let level = 0;
    while (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level++;
    }
    return level;
}

async function assignLevelRoles(user, guild, level) {
    const levelRoles = await LevelRole.find({ guildId: guild.id });
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    for (const levelRole of levelRoles) {
        const role = guild.roles.cache.get(levelRole.roleId);
        if (role) {
            if (level >= levelRole.level) {
                await member.roles.add(role).catch(console.error);
            } else {
                await member.roles.remove(role).catch(console.error);
            }
        }
    }
}

function xpForNextLevel(level) {
    return Math.floor(100 * Math.pow(1.1, level));
}