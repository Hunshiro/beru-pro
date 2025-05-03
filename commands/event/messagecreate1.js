const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const { Level, LevelRole } = require('../../models/level');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // console.log(`[MessageCreate] Received message from ${message.author.tag} (ID: ${message.author.id}) in guild ${message.guild?.name || 'DM'} (ID: ${message.guild?.id || 'N/A'})`);

        // Skip bot messages or non-guild messages
        if (message.author.bot) {
            // console.log(`[MessageCreate] Skipped: Message from bot ${message.author.tag}`);
            return;
        }
        if (!message.guild) {
            // console.log(`[MessageCreate] Skipped: Message in DMs`);
            return;
        }

        try {
            // Check MongoDB connection
            if (mongoose.connection.readyState !== 1) {
                console.error(`[MessageCreate] MongoDB not connected. State: ${mongoose.connection.readyState}`);
                return;
            }
            // console.log(`[MessageCreate] MongoDB connection active`);

            // Fetch or create level data
            let levelData = await Level.findOne({ userId: message.author.id, guildId: message.guild.id });
            if (!levelData) {
                // console.log(`[MessageCreate] No level data for ${message.author.tag}. Creating new entry.`);
                levelData = new Level({
                    userId: message.author.id,
                    guildId: message.guild.id,
                    xp: 0,
                    level: 0,
                    lastMessage: null,
                    notifications: true,
                });
            } else {
                // console.log(`[MessageCreate] Found level data for ${message.author.tag}: XP=${levelData.xp}, Level=${levelData.level}`);
            }

            // Check cooldown (60 seconds)
            const now = new Date();
            if (levelData.lastMessage && (now - levelData.lastMessage) < 60000) {
                // console.log(`[MessageCreate] Cooldown active for ${message.author.tag}. Last message: ${levelData.lastMessage}, Now: ${now}`);
                return;
            }
            levelData.lastMessage = now;
            // console.log(`[MessageCreate] Updated lastMessage for ${message.author.tag} to ${now}`);

            // Award random XP (10-25)
            const xpGained = Math.floor(Math.random() * 16) + 10;
            levelData.xp += xpGained;
            // console.log(`[MessageCreate] Awarded ${xpGained} XP to ${message.author.tag}. New XP: ${levelData.xp}`);

            // Check for level up
            const newLevel = calculateLevel(levelData.xp);
            if (newLevel > levelData.level) {
                levelData.level = newLevel;
                // console.log(`[MessageCreate] ${message.author.tag} leveled up to ${newLevel}`);

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
                    // console.log(`[MessageCreate] Sent level-up notification to ${message.author.tag}`);
                }

                // Assign level roles
                await assignLevelRoles(message.author, message.guild, newLevel);
                // console.log(`[MessageCreate] Assigned level roles for ${message.author.tag}`);
            }

            // Save level data
            await levelData.save();
            // console.log(`[MessageCreate] Saved level data for ${message.author.tag}: XP=${levelData.xp}, Level=${levelData.level}`);
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
                // Check role hierarchy: bot's highest role must be higher than the role to manage
                if (botMember.roles.highest.position <= role.position) {
                    console.warn(`[AssignLevelRoles] Cannot manage role ${role.name} due to role hierarchy in guild ${guild.id}`);
                    continue;
                }

                if (level >= levelRole.level) {
                    await member.roles.add(role).catch(err => console.error(`[AssignLevelRoles] Failed to add role ${role.name}:`, err));
                    // console.log(`[AssignLevelRoles] Added role ${role.name} to ${user.tag}`);
                } 
                // Do not remove roles to avoid missing access errors
                // else {
                //     await member.roles.remove(role).catch(err => console.error(`[AssignLevelRoles] Failed to remove role ${role.name}:`, err));
                //     // console.log(`[AssignLevelRoles] Removed role ${role.name} from ${user.tag}`);
                // }
            }
        }
    } catch (error) {
        console.error(`[AssignLevelRoles] Error assigning roles for ${user.tag}:`, error);
    }
}

function xpForNextLevel(level) {
    return Math.floor(100 * Math.pow(1.1, level));
}