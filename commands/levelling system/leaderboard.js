const { AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { Level } = require('../../models/level');
const path = require('path');

// Attempt to register font with fallback
try {
    registerFont(path.join(__dirname, '../../fonts/Exo2-Bold.ttf'), { family: 'Exo 2' });
    console.log('Exo 2 font registered successfully');
} catch (err) {
    console.warn('Failed to load Exo 2 font, falling back to Arial:', err.message);
}

module.exports = {
    name: 'leaderboard',
    description: 'Display the server leaderboard with user rankings in a Solo Leveling theme',
    async execute(message) {
        try {
            // Fetch all users sorted by XP
            const allUsers = await Level.find({ guildId: message.guild.id }).sort({ xp: -1 });
            if (!allUsers.length) {
                return message.reply('No users found in the leaderboard.');
            }

            const usersPerPage = 10;
            let currentPage = 0;
            const totalPages = Math.ceil(allUsers.length / usersPerPage);

            // Function to generate leaderboard canvas
            async function generateLeaderboard(page) {
                const start = page * usersPerPage;
                const end = start + usersPerPage;
                const pageUsers = allUsers.slice(start, end);

                // Canvas setup
                const rowHeight = 70;
                const headerHeight = 100;
                const canvasHeight = headerHeight + pageUsers.length * rowHeight + 40;
                const canvas = createCanvas(800, canvasHeight);
                const ctx = canvas.getContext('2d');

                // Background: Misty dungeon gradient
                const gradient = ctx.createLinearGradient(0, 0, 800, canvasHeight);
                gradient.addColorStop(0, '#0A0618');
                gradient.addColorStop(1, '#1C0B2B');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 800, canvasHeight);

                // Mist effect
                ctx.fillStyle = 'rgba(106, 13, 173, 0.15)';
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    ctx.ellipse(100 + i * 80, canvasHeight / 2, 50 + i * 5, 30 + i * 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Header
                ctx.fillStyle = 'rgba(20, 15, 50, 0.92)';
                ctx.shadowColor = '#9B59B6';
                ctx.shadowBlur = 20;
                roundRect(ctx, 20, 20, 760, headerHeight - 20, 15, true);
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#F1E9F6';
                ctx.font = 'bold 36px "Exo 2", Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Server Leaderboard (Page ${page + 1}/${totalPages})`, 400, 70);

                // User rows
                for (let i = 0; i < pageUsers.length; i++) {
                    const userData = pageUsers[i];
                    const y = headerHeight + i * rowHeight;
                    const rank = start + i + 1;

                    // User panel
                    ctx.fillStyle = 'rgba(30, 20, 60, 0.85)';
                    ctx.shadowColor = '#9B59B6';
                    ctx.shadowBlur = 10;
                    roundRect(ctx, 30, y, 740, rowHeight - 10, 10, true);
                    ctx.shadowBlur = 0;

                    // Avatar
                    try {
                        const user = await message.client.users.fetch(userData.userId);
                        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 64 }));
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(70, y + rowHeight / 2, 25, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(avatar, 45, y + rowHeight / 2 - 25, 50, 50);
                        ctx.restore();

                        // Avatar glow
                        ctx.strokeStyle = '#9B59B6';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(70, y + rowHeight / 2, 25, 0, Math.PI * 2);
                        ctx.stroke();
                    } catch (err) {
                        console.error(`Error loading avatar for user ${userData.userId}:`, err);
                    }

                    // Text
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#F1E9F6';
                    ctx.font = 'bold 24px "Exo 2", Arial, sans-serif';
                    ctx.fillText(`${rank}. ${message.client.users.cache.get(userData.userId)?.username || 'Unknown'}`, 120, y + 30);

                    ctx.fillStyle = '#D5C8E8';
                    ctx.font = '20px "Exo 2", Arial, sans-serif';
                    ctx.fillText(`Level: ${userData.level}`, 120, y + 55);
                    ctx.fillText(`XP: ${userData.xp}/${xpForNextLevel(userData.level)}`, 250, y + 55);

                    // Progress bar
                    const progress = userData.xp / xpForNextLevel(userData.level);
                    ctx.fillStyle = '#9B59B6';
                    ctx.shadowColor = '#9B59B6';
                    ctx.shadowBlur = 8;
                    roundRect(ctx, 400, y + 35, 300 * progress, 15, 4, true);
                    ctx.shadowBlur = 0;

                    ctx.strokeStyle = '#E8DAEF';
                    ctx.lineWidth = 2;
                    roundRect(ctx, 400, y + 35, 300, 15, 4, false, true);

                    // Rank badge for top 3
                    if (rank <= 3) {
                        ctx.fillStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
                        ctx.beginPath();
                        ctx.moveTo(750, y + rowHeight / 2);
                        for (let j = 0; j < 6; j++) {
                            ctx.lineTo(750 + 15 * Math.cos((j * 60 + 30) * Math.PI / 180), y + rowHeight / 2 + 15 * Math.sin((j * 60 + 30) * Math.PI / 180));
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 16px "Exo 2", Arial, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(`#${rank}`, 750, y + rowHeight / 2 + 5);
                    }
                }

                // Floating particles
                ctx.fillStyle = 'rgba(155, 89, 182, 0.8)';
                for (let i = 0; i < 15; i++) {
                    ctx.beginPath();
                    ctx.arc(50 + i * 50, 50 + (i % 3) * 20, 3 + (i % 4), 0, Math.PI * 2);
                    ctx.fill();
                }

                return canvas.toBuffer();
            }

            // Initial buttons
            const prevButton = new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0);
            const nextButton = new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1);
            const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

            // Send initial message
            const attachment = new AttachmentBuilder(await generateLeaderboard(currentPage), { name: 'leaderboard.png' });
            const msg = await message.reply({ files: [attachment], components: [row] });

            // Button collector
            const collector = msg.createMessageComponentCollector({ time: 60000 });
            collector.on('collect', async interaction => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: 'Only the command issuer can navigate the leaderboard.', ephemeral: true });
                }

                if (interaction.customId === 'prev' && currentPage > 0) {
                    currentPage--;
                } else if (interaction.customId === 'next' && currentPage < totalPages - 1) {
                    currentPage++;
                }

                // Update buttons
                prevButton.setDisabled(currentPage === 0);
                nextButton.setDisabled(currentPage === totalPages - 1);
                const updatedRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

                // Update canvas
                const updatedAttachment = new AttachmentBuilder(await generateLeaderboard(currentPage), { name: 'leaderboard.png' });
                await interaction.update({ files: [updatedAttachment], components: [updatedRow] });
            });

            collector.on('end', async () => {
                // Disable buttons after timeout
                prevButton.setDisabled(true);
                nextButton.setDisabled(true);
                const disabledRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
                await msg.edit({ components: [disabledRow] });
            });
        } catch (error) {
            console.error('Leaderboard error:', error);
            await message.reply('There was an error generating the leaderboard.');
        }
    },
};

function xpForNextLevel(level) {
    return Math.floor(100 * Math.pow(1.15, level));
}

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