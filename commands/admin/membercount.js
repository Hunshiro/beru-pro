const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    name: 'membercount',
    description: 'Displays server member count and statistics',
    async execute(message) {
        try {
            const guild = message.guild;
            if (!guild) {
                await message.reply('This command can only be used in a server.');
                return;
            }

            // Fetch all members (ensure intents include GuildMembers)
            const members = await guild.members.fetch();
            const totalMembers = members.size;
            const bots = members.filter(member => member.user.bot).size;
            const humans = totalMembers - bots;

            // Server details
            const serverName = guild.name;
            const serverId = guild.id;
            const createdAt = guild.createdAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

            // Create canvas
            const width = 1100;
            const height = 400;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // High-tech background with metallic gradient
            const bgGradient = ctx.createLinearGradient(0, 0, width, height);
            bgGradient.addColorStop(0, '#0f1c2e');
            bgGradient.addColorStop(0.3, '#2a4066');
            bgGradient.addColorStop(0.7, '#4a6a8e');
            bgGradient.addColorStop(1, '#1e2a44');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // Holographic grid overlay
            ctx.strokeStyle = 'rgba(0, 255, 150, 0.08)';
            ctx.lineWidth = 1.5;
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

            // Metallic card with neon glow
            ctx.fillStyle = 'rgba(20, 30, 50, 0.9)';
            ctx.shadowColor = 'rgba(0, 255, 150, 0.4)';
            ctx.shadowBlur = 30;
            roundRect(ctx, 40, 40, width - 80, height - 80, 35, true);
            ctx.shadowBlur = 0;

            // Server Icon (if available)
            let icon;
            try {
                icon = await loadImage(guild.iconURL({ extension: 'png', size: 256 }) || '');
                const iconX = 120, iconY = 120, iconRadius = 90;
                ctx.save();
                ctx.beginPath();
                ctx.arc(iconX, iconY, iconRadius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(icon, iconX - iconRadius, iconY - iconRadius, iconRadius * 2, iconRadius * 2);
                ctx.restore();
                ctx.lineWidth = 6;
                ctx.strokeStyle = '#00ff96';
                ctx.shadowColor = '#00ff96';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(iconX, iconY, iconRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            } catch (err) {
                console.error('Icon load error:', err);
            }

            // Server Name
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ff96';
            ctx.shadowBlur = 15;
            const name = serverName.length > 25 ? serverName.substring(0, 22) + '...' : serverName;
            ctx.textAlign = 'left';
            ctx.fillText(name, 250, 110);
            ctx.shadowBlur = 0;

            // Server ID
            ctx.font = '24px monospace';
            ctx.fillStyle = '#b0c4de';
            ctx.fillText(`ID: ${serverId}`, 250, 150);

            // Member Stats
            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = '#00ff96';
            ctx.fillText(`Total Members: ${totalMembers}`, 250, 200);
            ctx.fillText(`Humans: ${humans}`, 250, 250);
            ctx.fillText(`Bots: ${bots}`, 250, 300);

            // Creation Date
            ctx.font = '20px monospace';
            ctx.fillStyle = '#b0c4de';
            ctx.fillText(`Created: ${createdAt}`, 250, 350);

            // Timestamp
            const now = new Date();
            const timestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' });
            ctx.font = '16px monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'right';
            ctx.fillText(`Generated: ${timestamp} IST`, width - 50, height - 30);

            // Send member count card
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'membercount.png' });
            await message.reply({ files: [attachment] });
        } catch (error) {
            console.error('Membercount command error:', error);
            await message.reply('❌ Error generating member count. Please try again later.').catch(console.error);
        }
    },
};

// Draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}