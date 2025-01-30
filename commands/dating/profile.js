const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const User = require('../../models/user');

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

module.exports = {
  name: 'profile',
  description: 'Display your dating profile as a beautiful card',
  async execute(message) {
    try {
      const user = await User.findOne({ userId: message.author.id });
      
      if (!user) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Profile Not Found')
            .setDescription("You haven't created a profile yet. Use `/start` to create one!")
            .setFooter({ text: 'Dating System' })]
        });
      }

      // Create a wider canvas for better layout
      const canvas = createCanvas(1200, 700);
      const ctx = canvas.getContext('2d');

      // Create a dark theme background with noise texture
      ctx.fillStyle = '#151515';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add noise texture
      for (let i = 0; i < canvas.width; i += 4) {
        for (let j = 0; j < canvas.height; j += 4) {
          if (Math.random() > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
            ctx.fillRect(i, j, 4, 4);
          }
        }
      }

      // Add subtle gradient overlay
      const overlay = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      overlay.addColorStop(0, 'rgba(238, 174, 202, 0.1)');
      overlay.addColorStop(1, 'rgba(148, 187, 233, 0.1)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create main content area
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(30, 30, canvas.width - 60, canvas.height - 60);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Add decorative corner lines
      function drawCornerLines(x, y, right = false, bottom = false) {
        ctx.beginPath();
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 2;
        
        if (!right && !bottom) {
          ctx.moveTo(x, y + 40);
          ctx.lineTo(x, y);
          ctx.lineTo(x + 40, y);
        } else if (right && !bottom) {
          ctx.moveTo(x - 40, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + 40);
        } else if (!right && bottom) {
          ctx.moveTo(x, y - 40);
          ctx.lineTo(x, y);
          ctx.lineTo(x + 40, y);
        } else {
          ctx.moveTo(x - 40, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y - 40);
        }
        ctx.stroke();
      }

      // Draw corner lines
      drawCornerLines(50, 50);
      drawCornerLines(canvas.width - 50, 50, true);
      drawCornerLines(50, canvas.height - 50, false, true);
      drawCornerLines(canvas.width - 50, canvas.height - 50, true, true);

      // Profile picture with enhanced effects
      try {
        const avatar = await loadImage(message.author.displayAvatarURL({ extension: 'png', size: 256 }));
        const centerX = 200;
        const centerY = 200;
        const radius = 100;

        // Create hexagonal clip path
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();

        // Draw avatar
        ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();

        // Draw hexagon border
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Add glow effect
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } catch (error) {
        console.error('Error loading avatar:', error);
      }

      // Username and basic info
      ctx.textAlign = 'left';
      
      // Username with gradient
      const usernameGradient = ctx.createLinearGradient(350, 150, 800, 150);
      usernameGradient.addColorStop(0, '#FF69B4');
      usernameGradient.addColorStop(1, '#87CEEB');
      ctx.fillStyle = usernameGradient;
      ctx.font = 'bold 48px Arial';
      ctx.fillText(message.author.username, 350, 180);

      // Basic info with neon effect
      ctx.font = '28px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FF69B4';
      ctx.shadowBlur = 10;
      const basicInfo = `${user.age} │ ${user.sex} │ ${user.horoscope}`;
      ctx.fillText(basicInfo, 350, 230);
      ctx.shadowBlur = 0;

      // Draw sections with modern cards
      function drawCard(x, y, width, height, title, content, icon) {
        // Card background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw card with rounded corners
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        ctx.stroke();

        // Add gradient accent line at top
        const accentGradient = ctx.createLinearGradient(x, y, x + width, y);
        accentGradient.addColorStop(0, '#FF69B4');
        accentGradient.addColorStop(1, '#87CEEB');
        ctx.fillStyle = accentGradient;
        ctx.fillRect(x, y, width, 3);

        // Draw title with icon
        ctx.fillStyle = '#FF69B4';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${icon} ${title}`, x + 20, y + 35);

        // Draw content
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        const lines = wrapText(ctx, content, width - 40);
        lines.forEach((line, i) => {
          ctx.fillText(line, x + 20, y + 70 + (i * 25));
        });

        return 80 + (lines.length * 25); // Return total height used
      }

      // Layout cards in a grid
      const cardWidth = 350;
      const cardSpacing = 30;
      let startX = 50;
      let startY = 350;

      // Status and Likes in first row
      drawCard(startX, startY, cardWidth, 150, 'Status', user.status, '💖');
      drawCard(startX + cardWidth + cardSpacing, startY, cardWidth, 150, 'Likes', user.likes, '💝');
      drawCard(startX + (cardWidth + cardSpacing) * 2, startY, cardWidth, 150, 'Partner', 
        await (async () => {
          if (user.partner) {
            try {
              const partnerMember = await message.guild.members.fetch(user.partner);
              return partnerMember ? partnerMember.user.username : 'Unknown Partner';
            } catch (error) {
              return 'Unknown Partner';
            }
          }
          return 'Single';
        })(), '💍');

      // Hobbies and Dislikes in second row
      startY += 180;
      drawCard(startX, startY, cardWidth, 150, 'Hobbies', user.hobbies, '🎯');
      drawCard(startX + cardWidth + cardSpacing, startY, cardWidth, 150, 'Dislikes', user.dislikes, '💔');

      // Create and send the profile
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'profile.png' });
      const profileEmbed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle(`${message.author.username}'s Profile`)
        .setImage('attachment://profile.png')
        .setFooter({ text: 'Created with love by the Dating System' });

      await message.reply({ embeds: [profileEmbed], files: [attachment] });

    } catch (error) {
      console.error('Error generating profile:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('❌ Error')
        .setDescription('There was an issue generating your profile. Please try again later.')
        .setFooter({ text: 'Dating System' });
      await message.reply({ embeds: [errorEmbed] });
    }
  },
};