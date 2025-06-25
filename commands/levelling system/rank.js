const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { Level } = require('../../models/level');

const XP_PER_LEVEL = 100;

async function drawRankCard(ctx, user, levelData, rank, avatar, innerBg, width = 1100, height = 400) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(100, 255, 218, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }
    for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 40, 40, width - 80, height - 80, 20);
    ctx.clip();
    ctx.drawImage(innerBg, 40, 40, width - 80, height - 80);
    ctx.restore();

    ctx.shadowColor = '#64ffda';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'rgba(31, 41, 55, 0.8)';
    roundRect(ctx, 40, 40, width - 80, height - 80, 20, true);
    ctx.shadowBlur = 0;

    const avatarX = 130, avatarY = 130, avatarRadius = 80;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#64ffda';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#64ffda';
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const username = user.username.length > 18 ? user.username.substring(0, 15) + '...' : user.username;
    ctx.font = '36px Arial';
    ctx.fillStyle = '#f9fafb';
    ctx.textAlign = 'left';
    ctx.fillText(username, 250, 100);

    ctx.font = '22px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`#${user.discriminator || '0000'}`, 250, 135);

    const levelBoxX = 250, levelBoxY = 160;
    ctx.fillStyle = '#111827';
    ctx.shadowColor = '#64ffda';
    ctx.shadowBlur = 10;
    roundRect(ctx, levelBoxX, levelBoxY, 160, 55, 15, true);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#64ffda';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${levelData.level}`, levelBoxX + 80, levelBoxY + 35);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#f87171';
    ctx.fillText(`RANK #${rank}`, 500, 195);

    const barX = 250, barY = 240, barWidth = 700, barHeight = 40;
    ctx.fillStyle = '#111827';
    roundRect(ctx, barX, barY, barWidth, barHeight, 15, true);

    const totalXp = levelData.xp;
    const currentLevelXp = totalXpForLevel(levelData.level);
    const xpForNextLevel = totalXpForLevel(levelData.level + 1);
    const xpIntoCurrentLevel = totalXp - currentLevelXp;
    const xpNeeded = xpForNextLevel - currentLevelXp;
    const progress = Math.min(xpIntoCurrentLevel / xpNeeded, 1);
    const progressWidth = Math.floor(barWidth * progress);

    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    progressGradient.addColorStop(0, '#64ffda');
    progressGradient.addColorStop(1, '#00bfa5');
    ctx.fillStyle = progressGradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#64ffda';
    if (progressWidth > 0) roundRect(ctx, barX, barY, progressWidth, barHeight, 15, true);
    ctx.shadowBlur = 0;

    ctx.font = '18px Arial';
    ctx.fillStyle = '#e5e7eb';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(xpIntoCurrentLevel)} / ${xpNeeded} XP`, barX + barWidth / 2, barY + barHeight + 30);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`Total XP: ${totalXp}`, barX + barWidth / 2, barY + barHeight + 55);

    const aura = rank <= 5 ? '🔮 Elite' : rank <= 20 ? '🌌 Ascendant' : '⭐ Novice';
    ctx.font = '20px Arial';
    ctx.fillStyle = rank <= 5 ? '#e879f9' : rank <= 20 ? '#38bdf8' : '#facc15';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillText(aura, barX + barWidth - 120, barY - 20);
    ctx.shadowBlur = 0;

    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
    });
    ctx.font = '15px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(`Generated: ${timestamp} IST`, width - 50, height - 30);
}

function roundRect(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    if (fill) ctx.fill();
}

function xpForNextLevel(level) {
    return XP_PER_LEVEL;
}

function totalXpForLevel(level) {
    return level * XP_PER_LEVEL;
}

function calculateLevel(xp) {
    return Math.floor(xp / XP_PER_LEVEL);
}

module.exports = {
    name: 'rank',
    description: 'Displays a user\'s rank card with level, XP, and rank information',
    async execute(message) {
        try {
            const user = message.mentions.users.first() || message.author;
            let levelData = await Level.findOne({ userId: user.id, guildId: message.guild.id }) || { xp: 0, level: 0 };

            let avatar;
            try {
                avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
            } catch (err) {
                avatar = await loadImage('./assets/default-avatar.png');
            }

            const innerBg = await loadImage('https://images6.alphacoders.com/137/1372163.jpeg'); // example hosted background

            const calculatedLevel = calculateLevel(levelData.xp);
            if (calculatedLevel !== levelData.level) {
                levelData = await Level.findOneAndUpdate(
                    { userId: user.id, guildId: message.guild.id },
                    { $set: { level: calculatedLevel } },
                    { new: true, upsert: true }
                );
            }

            const allUsers = await Level.find({ guildId: message.guild.id }).sort({ xp: -1 });
            const rank = allUsers.findIndex(u => u.userId === user.id) + 1 || 1;

            const canvas = createCanvas(1100, 400);
            const ctx = canvas.getContext('2d');
            await drawRankCard(ctx, user, levelData, rank, avatar, innerBg);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank_card.png' });
            await message.reply({ files: [attachment] });
        } catch (error) {
            console.error('Rank command error:', error);
            await message.channel.send('❌ Error generating rank card. Please try again later.');
        }
    },
};
