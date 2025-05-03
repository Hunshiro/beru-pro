const { createCanvas } = require('canvas');
const { achievements } = require('../riddle/riddle-data');

function generateScoreCanvas(userId, member) {
  const user = getUserData(userId);
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 800, 400);
  gradient.addColorStop(0, '#1a0033');
  gradient.addColorStop(1, '#330066');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 400);

  // Decorative aura particles
  ctx.fillStyle = '#ffd70033';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 400;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ffd700';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(`${member.displayName}'s Riddle Stats`, 50, 80);

  // Stats
  ctx.shadowBlur = 0;
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#e6e6e6';
  ctx.fillText(`Riddles Solved: ${user.riddlesSolved}`, 50, 140);
  ctx.fillText(`Attempts Made: ${user.attempts}`, 50, 180);
  ctx.fillText(`Success Rate: ${user.attempts ? Math.round((user.riddlesSolved / user.attempts) * 100) : 0}%`, 50, 220);

  // Progress bar
  const nextAchievement = achievements.find(a => a.threshold > user.riddlesSolved) || achievements[achievements.length - 1];
  const progress = user.riddlesSolved / nextAchievement.threshold;
  ctx.fillStyle = '#ffffff22';
  ctx.fillRect(50, 260, 700, 30);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(50, 260, 700 * progress, 30);
  ctx.strokeStyle = '#ffd700aa';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 260, 700, 30);
  ctx.fillStyle = '#e6e6e6';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Next: ${nextAchievement.name} (${nextAchievement.threshold})`, 50, 310);

  // Achievements
  ctx.font = '20px sans-serif';
  ctx.fillText('Achievements:', 50, 350);
  let xPos = 50;
  user.achievements.forEach(ach => {
    const achObj = achievements.find(a => a.name === ach);
    ctx.fillText(`${achObj.emoji} ${ach}`, xPos, 380);
    xPos += 150;
  });

  return canvas.toBuffer('image/png');
}

module.exports = { generateScoreCanvas };