const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { Level } = require('../../models/level');

module.exports = {
    name: 'rank',
    description: 'Display your rank card with level and XP in a Solo Leveling theme',
    async execute(message) {
        try {
            const user = message.mentions.users.first() || message.author;
            const levelData = await Level.findOne({ userId: user.id, guildId: message.guild.id }) || { xp: 0, level: 0 };

            // Calculate rank
            const allUsers = await Level.find({ guildId: message.guild.id }).sort({ xp: -1 });
            const rank = allUsers.findIndex(u => u.userId === user.id) + 1;

            // Create canvas
            const canvas = createCanvas(1000, 300);
            const ctx = canvas.getContext('2d');

            // Background - dark blue-purple gradient similar to Solo Leveling's dark atmosphere
            const gradient = ctx.createLinearGradient(0, 0, 1000, 300);
            gradient.addColorStop(0, '#0A0B30');  // Dark blue
            gradient.addColorStop(0.7, '#1A0B3E'); // Dark purple
            gradient.addColorStop(1, '#0A0A16');   // Nearly black
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1000, 300);

            // Add shadow particles effect (similar to blue shadows in Solo Leveling)
            createShadowParticles(ctx, 1000, 300);

            // Card inner frame with glowing border
            drawGlowingFrame(ctx, 20, 20, 960, 260);

            // User avatar with glowing blue aura (like a hunter's aura)
            try {
                const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
                
                // Draw blue shadow aura first (multiple layers for intensity)
                for (let i = 0; i < 3; i++) {
                    const size = 140 + i * 10;
                    const offset = (size - 140) / 2;
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(140, 150, size/2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 162, 255, ${0.1 - i * 0.03})`;
                    ctx.shadowColor = '#00A2FF';
                    ctx.shadowBlur = 20;
                    ctx.fill();
                    ctx.restore();
                }
                
                // Draw avatar
                ctx.save();
                ctx.beginPath();
                ctx.arc(140, 150, 70, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 70, 80, 140, 140);
                ctx.restore();
                
                // Draw avatar border (glowing blue ring)
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#00A2FF';
                ctx.shadowColor = '#00A2FF';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(140, 150, 70, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            } catch (err) {
                console.error('Error loading avatar:', err);
            }

            // Text styling - using system fonts that look futuristic
            // Username with glow effect
            ctx.textAlign = 'left';
            ctx.font = 'bold 36px Arial, sans-serif';
            
            // Text shadow for glow effect
            ctx.fillStyle = '#00A2FF';
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 8; i++) {
                const offset = i * 0.5;
                ctx.fillText(user.username, 240 + offset, 90);
                ctx.fillText(user.username, 240 - offset, 90);
                ctx.fillText(user.username, 240, 90 + offset);
                ctx.fillText(user.username, 240, 90 - offset);
            }
            ctx.globalAlpha = 1;
            
            // Main text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(user.username, 240, 90);

            // Level, XP, and Rank
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.fillStyle = '#EAEAEA';
            
            // Add "HUNTER" rank title (Solo Leveling reference)
            let hunterRank = "E";
            if (levelData.level >= 50) hunterRank = "S";
            else if (levelData.level >= 40) hunterRank = "A";
            else if (levelData.level >= 30) hunterRank = "B";
            else if (levelData.level >= 20) hunterRank = "C";
            else if (levelData.level >= 10) hunterRank = "D";
            
            ctx.fillText(`HUNTER RANK: ${hunterRank}`, 240, 130);
            ctx.fillText(`Level: ${levelData.level}`, 240, 165);
            const totalXpCurrentLevel = totalXpForLevel(levelData.level);
            const totalXpNextLevel = totalXpForLevel(levelData.level + 1);
            ctx.fillText(`XP: ${levelData.xp}/${totalXpNextLevel}`, 240, 200);
            ctx.fillText(`Server Rank: #${rank}`, 240, 235);

            // Calculate XP relative to current level
            const xpForCurrentLevel = totalXpForLevel(levelData.level);
            let xpRelative = levelData.xp - xpForCurrentLevel;
            const xpNextLevel = xpForNextLevel(levelData.level);
            if (xpRelative > xpNextLevel) xpRelative = xpNextLevel; // Clamp to max
            const progress = xpRelative / xpNextLevel;

            // Progress bar - blue glowing like Solo Leveling's power visualization
            const barWidth = 550;
            
            // Progress bar background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            roundRect(ctx, 240, 250, barWidth, 25, 12, true);
            
            // Progress fill with glow effect
            ctx.shadowColor = '#00A2FF';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(0, 162, 255, 0.8)';
            roundRect(ctx, 240, 250, barWidth * progress, 25, 12, true);
            ctx.shadowBlur = 0;
            
            // Add stats icon (like stats in Solo Leveling)
            addStatIcon(ctx, 850, 110);
            
            // Add blue magic runes (similar to Solo Leveling's system interface)
            drawMagicRunes(ctx);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank_card.png' });
            await message.reply({ files: [attachment] });
        } catch (error) {
            console.error('Rank card error:', error);
            // Send error message without message_reference to avoid Invalid Form Body error
            await message.channel.send('There was an error generating your rank card.').catch(console.error);
        }
    },
};

// Calculate XP needed for next level with exponential scaling
function xpForNextLevel(level) {
    return Math.floor(100 * Math.pow(1.2, level));
}

// Calculate total XP required to reach a given level (sum of all previous levels' XP requirements)
function totalXpForLevel(level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
        total += xpForNextLevel(i);
    }
    return total;
}

// Helper function to draw rounded rectangles
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

// Create blue shadow particles like the shadow monarch's aura
function createShadowParticles(ctx, width, height) {
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 4 + 1;
        const opacity = Math.random() * 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 162, 255, ${opacity})`;
        ctx.shadowColor = '#00A2FF';
        ctx.shadowBlur = 5;
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

// Draw a glowing frame
function drawGlowingFrame(ctx, x, y, width, height) {
    // Outer glow
    ctx.shadowColor = '#00A2FF';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00A2FF';
    roundRect(ctx, x, y, width, height, 15, false, true);
    
    // Inner panel
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 20, 50, 0.7)';
    roundRect(ctx, x + 10, y + 10, width - 20, height - 20, 10, true);
    
    // Inner border
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 162, 255, 0.5)';
    roundRect(ctx, x + 10, y + 10, width - 20, height - 20, 10, false, true);
}

// Add a stat icon similar to Solo Leveling's UI
function addStatIcon(ctx, x, y) {
    // Circular stat icon background
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 30, 60, 0.6)';
    ctx.fill();
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00A2FF';
    ctx.shadowColor = '#00A2FF';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Add inner details
    ctx.beginPath();
    ctx.arc(x, y, 50, -Math.PI/2, Math.PI * 1.5);
    ctx.strokeStyle = 'rgba(0, 162, 255, 0.5)';
    ctx.stroke();
    
    // Add center point
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00A2FF';
    ctx.shadowColor = '#00A2FF';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Draw magic runes similar to Solo Leveling's system interface
function drawMagicRunes(ctx) {
    ctx.strokeStyle = '#00A2FF';
    ctx.lineWidth = 1;
    
    // Draw hexagonal rune patterns
    for (let i = 0; i < 3; i++) {
        const x = 850 + i * 20;
        const y = 200 + i * 15;
        
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const angle = (Math.PI / 3) * j;
            const size = 15;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.shadowColor = '#00A2FF';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Add glowing dots to represent magic power
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI / 6) * i;
        const radius = 35;
        const x = 850 + Math.cos(angle) * radius;
        const y = 200 + Math.sin(angle) * radius;
        const size = Math.random() * 2 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = '#00A2FF';
        ctx.shadowColor = '#00A2FF';
        ctx.shadowBlur = 5;
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}