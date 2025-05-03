const { createCanvas, registerFont } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const User = require('../../models/user');
const path = require('path');

// Attempt to register Orbitron font, with fallback to sans-serif
try {
  registerFont(path.join(__dirname, '../../assets/fonts/Orbitron-Bold.ttf'), { family: 'Orbitron' });
} catch (error) {
  console.warn('Failed to load Orbitron font, falling back to sans-serif:', error.message);
}

module.exports = {
  name: 'dleaderboard',
  description: 'Shows top users in the Daddy Role League with a dark, aurafull aesthetic',
  async execute(message) {
    try {
      // Fetch top 10 registered users, sorted by points
      const topUsers = await User.find({ registered: true }).sort({ points: -1 }).limit(10);

      if (!topUsers.length) {
        return message.reply('No users are ranked yet.');
      }

      // Canvas setup
      const width = 900;
      const height = 650;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0a0a1a'); // Deep navy
      gradient.addColorStop(1, '#1c1c2c'); // Charcoal
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle particle effect (faint lines)
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
      }

      // Neon border
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.7)';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, width - 16, height - 16);

      // Title with neon glow
      ctx.fillStyle = '#e0e7ff';
      ctx.font = 'bold 44px Orbitron, sans-serif';
      ctx.shadowColor = 'rgba(100, 150, 255, 0.8)';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText('🏆 Daddy Role League Leaderboard 🏆', width / 2, 80);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';

      // Loop through users
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        let displayName = 'Unknown User';
        try {
          const member = await message.guild.members.fetch(user.userId);
          displayName = member.displayName.slice(0, 22); // Truncate long names
        } catch (error) {
          console.warn(`Failed to fetch member ${user.userId}:`, error.message);
        }
        const y = 140 + i * 50;

        // Background stripe
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(50, y - 35, width - 100, 40);

        // Rank badge or number
        ctx.fillStyle = i < 3 ? '#64c8ff' : '#b0b8ff'; // Neon blue for top 3, muted blue for others
        ctx.font = 'bold 28px Orbitron, sans-serif';
        let rankText = `${i + 1}.`;
        if (i === 0) rankText = '🥇';
        else if (i === 1) rankText = '🥈';
        else if (i === 2) rankText = '🥉';
        ctx.shadowColor = 'rgba(100, 150, 255, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText(rankText, 80, y);
        ctx.shadowBlur = 0;

        // Username with neon accent
        ctx.fillStyle = '#b0b8ff'; // Muted neon blue
        ctx.font = '24px Orbitron, sans-serif';
        ctx.shadowColor = 'rgba(150, 100, 255, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText(displayName, 140, y);
        ctx.shadowBlur = 0;

        // Points with neon glow
        ctx.fillStyle = '#9664ff'; // Neon purple
        ctx.font = 'bold 24px Orbitron, sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(150, 100, 255, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText(`${user.points} pts`, width - 80, y);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
      }

      // Footer text
      ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
      ctx.font = 'italic 18px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Embrace the aura of the Daddy Role League', width / 2, height - 30);

      // Export canvas to attachment
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'leaderboard.png' });

      await message.channel.send({
        content: '**Behold the Daddy Role League Leaderboard!** 🌌',
        files: [attachment]
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
      await message.reply('An error occurred while generating the leaderboard. Please try again later.');
    }
  },
};