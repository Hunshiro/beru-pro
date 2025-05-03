const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const User = require('../../models/user');

function getAuraLevel(points) {
  if (points >= 80) return { label: 'Daddy', emoji: '😈', color: '#ff4444', next: null, threshold: 80 };
  if (points >= 50) return { label: 'Legend', emoji: '🧙', color: '#ffd700', next: 'Daddy', threshold: 80 };
  if (points >= 30) return { label: 'Men', emoji: '👨', color: '#00ccff', next: 'Legend', threshold: 50 };
  if (points >= 20) return { label: 'Adult', emoji: '🧑', color: '#00ff00', next: 'Men', threshold: 30 };
  if (points >= 10) return { label: 'Boy', emoji: '👦', color: '#ffaa00', next: 'Adult', threshold: 20 };
  return { label: 'Kid', emoji: '🍼', color: '#ff66cc', next: 'Boy', threshold: 10 };
}

module.exports = {
  name: 'dprofile',
  description: 'Show your aura profile card',
  async execute(message) {
    try {
      const userId = message.author.id;
      const userData = await User.findOne({ userId });

      if (!userData || !userData.registered) {
        return message.reply("You're not registered. Use `!register` to join the Daddy Role League.");
      }

      const points = userData.points || 0;
      const { label, emoji, color, next, threshold } = getAuraLevel(points);
      const percent = next ? Math.min(points / threshold, 1) : 1;

      const width = 800;
      const height = 400; // Increased height for more space
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1a1a2d');
      gradient.addColorStop(1, '#2d2d4a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Glowing avatar circle
      ctx.save();
      const avatarSize = 140;
      try {
        // Ensure proper URL format for avatar
        const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
        const avatar = await loadImage(avatarURL);
        
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(100, 150, avatarSize/2 + 10, 0, Math.PI * 2);
        ctx.fillStyle = `${color}33`; // Semi-transparent glow
        ctx.fill();
        
        // Avatar
        ctx.beginPath();
        ctx.arc(100, 150, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 30, 80, avatarSize, avatarSize);
      } catch (error) {
        console.error('Avatar load error:', error);
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(100, 150, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Title with glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(message.member?.displayName || message.author.username, 220, 100);

      // Level with animated feel
      ctx.shadowBlur = 5;
      ctx.fillStyle = color;
      ctx.font = 'italic bold 28px sans-serif';
      ctx.fillText(`${emoji} ${label}`, 220, 150);

      // Aura points
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Aura Points: ${points}`, 220, 200);

      // Enhanced progress bar
      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(220, 240, 500, 40);
      
      const progressGradient = ctx.createLinearGradient(220, 0, 720, 0);
      progressGradient.addColorStop(0, `${color}88`);
      progressGradient.addColorStop(1, color);
      ctx.fillStyle = progressGradient;
      ctx.fillRect(220, 240, 500 * percent, 40);
      
      ctx.strokeStyle = `${color}aa`;
      ctx.lineWidth = 2;
      ctx.strokeRect(220, 240, 500, 40);

      // Progress text
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.fillText(`${Math.round(percent * 100)}%`, 730, 265);

      // Next level with flair
      ctx.font = 'italic 20px sans-serif';
      if (next) {
        ctx.fillStyle = '#ffffff88';
        ctx.fillText(`Next: ${next} (${threshold} pts)`, 220, 320);
      } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('✨ MAXIMUM AURA ACHIEVED ✨', 220, 320);
      }

      // Aura sparkles (decorative)
      ctx.fillStyle = `${color}66`;
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'dprofile.png' });

      await message.channel.send({
        content: `Here’s your aura profile, <@${userId}> ✨`,
        files: [attachment]
      });

    } catch (error) {
      console.error('Profile card error:', error);
      return message.reply('Error generating profile card. Please try again!');
    }
  }
};