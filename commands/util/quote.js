const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

module.exports = {
  name: 'quote',
  description: 'Generate a stylish quote banner with background image and user avatar',
  async execute(message, args) {
    try {
      // Get quote text and user information
      const quote = args.join(' ') || 'No quote provided';
      const user = message.author;
      
      // Create canvas with 16:9 aspect ratio
      const canvas = Canvas.createCanvas(1200, 675);
      const ctx = canvas.getContext('2d');

      // Load and draw background image
      const background = await Canvas.loadImage('https://res.cloudinary.com/dwhkjrluc/image/upload/v1738081589/wallpaper_crdcmk.jpg');
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Add semi-transparent overlay for better text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw decorative right bracket
      ctx.font = 'bold 400px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillText('}', canvas.width - 300, canvas.height/2 + 140);

      // Function to wrap text
      function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        const lines = [];

        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        return lines.map((line, i) => {
          context.fillText(line, x, y + (i * lineHeight));
          return y + (i * lineHeight);
        });
      }

      // Draw quote text
      ctx.font = 'bold 60px "Times New Roman"';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      const lastLineY = wrapText(
        ctx,
        `"${quote}"`,
        100,
        canvas.height/2 - 50,
        canvas.width - 500,
        50
      ).pop();

      // Load and draw user avatar
      const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
      
      // Create circular clipping path for avatar
      ctx.save();
      ctx.beginPath();
      const avatarSize = 80;
      const avatarX = 100;
      const avatarY = lastLineY + 50;
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Draw avatar
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Add user name
      ctx.font = '30px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`- ${user.username}`, avatarX + avatarSize + 20, avatarY + avatarSize/2 + 10);

      // Add subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Add corner decorations
      function drawCorner(x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(40, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 40);
        ctx.stroke();
        ctx.restore();
      }

      // Draw corners
      drawCorner(30, 30, 0);
      drawCorner(canvas.width - 30, 30, 90);
      drawCorner(30, canvas.height - 30, -90);
      drawCorner(canvas.width - 30, canvas.height - 30, 180);

      // Create and send the image
      const attachment = new AttachmentBuilder(canvas.toBuffer(), 'quote-banner.png');
      return message.channel.send({ files: [attachment] });
    } catch (error) {
      console.error('Error creating quote banner:', error);
      return message.reply('There was an error generating the quote banner.');
    }
  }
};