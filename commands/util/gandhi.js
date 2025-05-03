const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

module.exports = {
  name: 'gandhi',
  description: 'Generate a stylish quote banner with a themed background and user avatar',
  async execute(message, args) {
    try {
      // Get quote text and user info
      const quote = args.join(' ') || 'No quote provided';
      const user = message.author;

      // Create canvas (16:9 aspect ratio: 1200x675 pixels)
      const canvas = Canvas.createCanvas(1200, 675);
      const ctx = canvas.getContext('2d');

      // Array of background images with various themes (replace with actual URLs)
      const backgroundImages = [
           'https://t3.ftcdn.net/jpg/09/68/67/52/240_F_968675298_LbXLPbLPzHo6ZXcVJcEJDhXYxoTSunsa.jpg'
      ];

      // Load and draw a random background image
      const background = await Canvas.loadImage(backgroundImages[Math.floor(Math.random() * backgroundImages.length)]);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Add a radial gradient overlay for depth and readability
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Optional watermark (uncomment and replace URL if desired)
      // const watermark = await Canvas.loadImage('https://example.com/watermark.png');
      // ctx.globalAlpha = 0.2;
      // ctx.drawImage(watermark, canvas.width - 100, canvas.height - 100, 80, 80);
      // ctx.globalAlpha = 1;

      // Function to split text into lines for wrapping
      function splitText(context, text, maxWidth) {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = context.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            lines.push(line.trim());
            line = word + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());
        return lines;
      }

      // Set font for quote text
      ctx.font = 'bold 60px Georgia';
      const maxWidth = canvas.width - 500; // Leaves space on the sides

      // Split quote into lines for wrapping
      const lines = splitText(ctx, `"${quote}"`, maxWidth);
      const lineHeight = 80; // Adjusted for readability with 60px font
      const totalTextHeight = lines.length * lineHeight;

      // Calculate total content height (quote + avatar + spacing)
      const avatarSize = 80;
      const spacing = 20;
      const contentHeight = totalTextHeight + spacing + avatarSize;
      const startingY = (canvas.height - contentHeight) / 2; // Centers content vertically

      // Draw quote text with shadow
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 5;
      lines.forEach((line, i) => {
        ctx.fillText(line, 100, startingY + i * lineHeight);
      });
      ctx.shadowColor = 'transparent'; // Reset shadow

      // Position avatar and username below quote
      const avatarY = startingY + totalTextHeight + spacing;
      const avatarX = 100;

      // Load and draw circular avatar
      // const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
      // ctx.save();
      // ctx.beginPath();
      // ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      // ctx.closePath();
      // ctx.clip();
      // ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      // ctx.restore();

      // Draw username with a subtle background rectangle
      // ctx.font = 'italic 30px Arial';
      // const nameText = `- ${user.username}`;
      // const nameWidth = ctx.measureText(nameText).width;
      // ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      // ctx.fillRect(avatarX + avatarSize + 10, avatarY + avatarSize / 2 - 15, nameWidth + 20, 30);
      // ctx.fillStyle = '#ffffff';
      // ctx.fillText(nameText, avatarX + avatarSize + 20, avatarY + avatarSize / 2 + 10);

      // Add double border for a sophisticated frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Add footer text: "Share this quote" and timestamp
      ctx.font = '20px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Share this quote', canvas.width / 2, canvas.height - 30);
      const date = new Date().toLocaleDateString();
      ctx.font = '16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(date, canvas.width - 30, canvas.height - 30);

      // Generate and send the image
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'quote-banner.png' });
      return message.channel.send({ files: [attachment] });
    } catch (error) {
      console.error('Error creating quote banner:', error);
      return message.reply('Sorry, there was an error generating the quote banner.');
    }
  },
};