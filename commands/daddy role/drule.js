const { createCanvas } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  name: 'drule',
  description: 'Show the Daddy Role League rules',
  async execute(message) {
    try {
      const width = 800;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Cosmic gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1a0033');
      gradient.addColorStop(0.5, '#2d004d');
      gradient.addColorStop(1, '#4b0082');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Glowing title
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff66cc';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Daddy Role League Rules', width / 2, 80);

      // Rules container with aura effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#9e5eff';
      ctx.fillStyle = '#ffffff11';
      ctx.fillRect(50, 120, 700, 430);
      ctx.strokeStyle = '#9e5eff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 120, 700, 430);

      // Rules text
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      const rules = [
        { text: "1. Only RC Daddy Role members can award aura points", color: '#ff66cc' },
        { text: "2. Earn up to 3 aura points from each Daddy", color: '#ffaa00' },
        { text: "3. Aura Levels:", color: '#ffffff' },
        { text: "   0 - Kid 🍼   |   10 - Boy 👦   |   20 - Adult 🧑", color: '#00ff00' },
        { text: "   30 - Man 👨   |   50 - Legend 🧙   |   80 - Daddy 😈", color: '#00ff00' },
        { text: "4. Reach 80 points to earn the Daddy role!", color: '#ffd700' },
        { text: "5. Don't spam ping Daddies or lose your role", color: '#ff4444' },
        { text: "6. No aura point begging - earn them through valor", color: '#00ccff' },
        { text: "7. Daddies' decisions are final in point disputes", color: '#ff66cc' },
        { text: "8. Show respect to maintain your aura", color: '#ffd700' }
      ];

      let yPos = 160;
      ctx.font = 'bold 22px sans-serif';
      for (const rule of rules) {
        ctx.fillStyle = rule.color;
        ctx.fillText(rule.text, 80, yPos);
        yPos += 40;
      }

      // Aura particles
      ctx.shadowBlur = 10;
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 4 + 2;
        const colors = ['#ff66cc', '#9e5eff', '#ffd700', '#00ff00'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Decorative border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Aura signature
      ctx.fillStyle = '#ffffff88';
      ctx.font = 'italic 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Blessed by the Council of Daddies', width / 2, height - 30);

      const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'drule.png' });

      await message.channel.send({
        content: `Behold the sacred rules of the Daddy Role League, <@${message.author.id}> ✨`,
        files: [attachment]
      });

    } catch (error) {
      console.error('Rules card error:', error);
      return message.reply('Error displaying the sacred rules!');
    }
  }
};