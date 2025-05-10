const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const { Level, LevelRole } = require('../../models/level');
const ServerSettings = require('../../models/serverSettings');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Skip bot messages or non-guild messages
        if (message.author.bot) {
            return;
        }
        if (!message.guild) {
            return;
        }

        try {
            // Check MongoDB connection
            if (mongoose.connection.readyState !== 1) {
                console.error(`[MessageCreate] MongoDB not connected. State: ${mongoose.connection.readyState}`);
                return;
            }

            // Fetch or create level data
            let levelData = await Level.findOne({ userId: message.author.id, guildId: message.guild.id });
            if (!levelData) {
                levelData = new Level({
                    userId: message.author.id,
                    guildId: message.guild.id,
                    xp: 0,
                    level: 0,
                    lastMessage: null,
                    notifications: true,
                });
            }

            // Fetch server settings for XP reward and cooldown
            let serverSettings = await ServerSettings.findOne({ guildId: message.guild.id });
            if (!serverSettings) {
                // Use default values if no settings found
                serverSettings = { xpReward: 10, cooldownSeconds: 30 };
            }

            // Check cooldown based on server settings
            const now = new Date();
            if (levelData.lastMessage) {
                const diffSeconds = (now - levelData.lastMessage) / 1000;
                if (diffSeconds < serverSettings.cooldownSeconds) {
                    // Cooldown active, do not award XP
                    return;
                }
            }
            levelData.lastMessage = now;

            // Award XP based on server settings
            const xpGained = serverSettings.xpReward;
            levelData.xp += xpGained;

            // Check for level up
            const newLevel = calculateLevel(levelData.xp);
            if (newLevel > levelData.level) {
                levelData.level = newLevel;

                // Send level up notification
                if (levelData.notifications) {
                    const embed = new EmbedBuilder()
                        .setTitle('🎉 Level Up!')
                        .setDescription(`Congratulations! You've reached **Level ${newLevel}** in ${message.guild.name}!`)
                        .setColor('#66BFBF')
                        .setTimestamp();

                    const muteButton = new ButtonBuilder()
                        .setCustomId('mute_level_notifications')
                        .setLabel('Mute Notifications')
                        .setStyle(ButtonStyle.Secondary);

                    const row = new ActionRowBuilder().addComponents(muteButton);

                    await message.author.send({ embeds: [embed], components: [row] }).catch(err => {
                        console.error(`[MessageCreate] Failed to send DM to ${message.author.tag}:`, err);
                    });
                }

                // Assign level roles
                await assignLevelRoles(message.author, message.guild, newLevel);
            }

            // Save level data
            await levelData.save();
        } catch (error) {
            console.error(`[MessageCreate] Error processing message for ${message.author.tag}:`, error);
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
    try {
        const botMember = await guild.members.fetch(guild.client.user.id);
        if (!botMember.permissions.has('ManageRoles')) {
            console.warn(`[AssignLevelRoles] Bot lacks Manage Roles permission in guild ${guild.id}`);
            return;
        }

        const levelRoles = await LevelRole.find({ guildId: guild.id });
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            console.log(`[AssignLevelRoles] Member ${user.tag} not found in guild`);
            return;
        }

        for (const levelRole of levelRoles) {
            const role = guild.roles.cache.get(levelRole.roleId);
            if (role) {
                if (botMember.roles.highest.position <= role.position) {
                    console.warn(`[AssignLevelRoles] Cannot manage role ${role.name} due to role hierarchy in guild ${guild.id}`);
                    continue;
                }

                if (level >= levelRole.level) {
                    await member.roles.add(role).catch(err => console.error(`[AssignLevelRoles] Failed to add role ${role.name}:`, err));
                }
            }
        }
    } catch (error) {
        console.error(`[AssignLevelRoles] Error assigning roles for ${user.tag}:`, error);
    }
}

function xpForNextLevel(level) {
    return Math.floor(100 * Math.pow(1.1, level));
}
