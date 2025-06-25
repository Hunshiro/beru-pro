const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');
const mongoose = require('mongoose');
const { Level, LevelRole } = require('../../models/level');
const ServerSettings = require('../../models/serverSettings');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    try {
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
          lastNotifiedLevel: -1,
        });
      }

      // Fetch server XP settings
      let serverSettings = await ServerSettings.findOne({ guildId: message.guild.id });
      if (!serverSettings) {
        serverSettings = { xpReward: 10, cooldownSeconds:30 };
      }

      const now = new Date();
      if (levelData.lastMessage) {
        const diffSeconds = (now - levelData.lastMessage) / 1000;
        if (diffSeconds < serverSettings.cooldownSeconds) return;
      }

      levelData.lastMessage = now;

      const previousLevel = levelData.level;
      const updatedXP = levelData.xp + serverSettings.xpReward;
      const calculatedLevel = calculateLevel(updatedXP);

      const leveledUp = calculatedLevel > previousLevel;
      const shouldNotify = leveledUp && levelData.lastNotifiedLevel !== calculatedLevel;

      levelData.xp = updatedXP;
      levelData.level = calculatedLevel;

      // Send DM if eligible
      if (shouldNotify && levelData.notifications) {
        const embed = new EmbedBuilder()
          .setTitle('🎉 Level Up!')
          .setDescription(`Congratulations! You've reached **Level ${calculatedLevel}** in ${message.guild.name}!`)
          .setImage('https://images6.alphacoders.com/137/1372163.jpeg')
          .setColor('#66BFBF')
          .setTimestamp();

        const muteButton = new ButtonBuilder()
          .setCustomId('mute_level_notifications')
          .setLabel('Mute Notifications')
          .setStyle(ButtonStyle.Secondary);

        const joinButton = new ButtonBuilder()
          .setLabel('Join Our Server')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.gg/rapcod'); // 🔁 Replace with your real invite

        const row = new ActionRowBuilder().addComponents(muteButton, joinButton);

        await message.author.send({ embeds: [embed], components: [row] }).catch(err => {
          console.error(`[MessageCreate] Failed to send DM to ${message.author.tag}:`, err);
        });

        levelData.lastNotifiedLevel = calculatedLevel; // ✅ Lock DM per level
      }

      if (leveledUp) {
        await assignLevelRoles(message.author, message.guild, calculatedLevel);
      }

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

function xpForNextLevel(level) {
  return Math.floor(100 * Math.pow(1.1, level));
}

async function assignLevelRoles(user, guild, level) {
  try {
    const botMember = await guild.members.fetch(guild.client.user.id);
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
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
          console.warn(`[AssignLevelRoles] Cannot manage role ${role.name} due to hierarchy`);
          continue;
        }

        if (level >= levelRole.level) {
          await member.roles.add(role).catch(err =>
            console.error(`[AssignLevelRoles] Failed to add role ${role.name}:`, err)
          );
        }
      }
    }
  } catch (error) {
    console.error(`[AssignLevelRoles] Error assigning roles for ${user.tag}:`, error);
  }
}
