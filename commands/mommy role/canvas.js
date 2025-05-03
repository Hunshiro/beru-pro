const { createCanvas } = require('canvas');
const { ranks } = require('./data');

// Utility function for rounded rectangle
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function generateProfileCanvas(userData, member) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 800, 400);
  gradient.addColorStop(0, '#330033');
  gradient.addColorStop(1, '#660066');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 400);

  // Aura particles
  ctx.fillStyle = '#ffd70044';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 400;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Avatar (unchanged)
  try {
    const { loadImage } = require('canvas');
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3399';
    ctx.beginPath();
    ctx.arc(100, 150, 70, 0, Math.PI * 2);
    ctx.fillStyle = '#ff339933';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(100, 150, 60, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 40, 90, 120, 120);
    ctx.restore();
  } catch (error) {
    console.error('Avatar load error:', error);
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(100, 150, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rank and name
  const rank = ranks.find(r => r.name === userData.rank);
  ctx.shadowBlur = 10;
  ctx.shadowColor = rank.color;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(member.displayName, 220, 120);
  ctx.fillStyle = rank.color;
  ctx.font = 'italic bold 26px sans-serif';
  ctx.fillText(`${rank.emoji} ${rank.name}`, 220, 160);

  // Glory points
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e6e6e6';
  ctx.font = '22px sans-serif';
  ctx.fillText(`Glory Points: ${userData.gloryPoints}`, 220, 200);

  // Progress bar
  const nextRank = ranks.find(r => r.threshold > userData.gloryPoints) || ranks[ranks.length - 1];
  const percent = userData.gloryPoints / nextRank.threshold;
  ctx.fillStyle = '#ffffff22';
  drawRoundRect(ctx, 220, 230, 500, 30, 10);
  ctx.fill();
  ctx.fillStyle = rank.color;
  drawRoundRect(ctx, 220, 230, 500 * percent, 30, 10);
  ctx.fill();
  ctx.strokeStyle = rank.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(220, 230, 500, 30);
  ctx.fillStyle = '#e6e6e6';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Next: ${nextRank.name} (${nextRank.threshold})`, 220, 280);

  return canvas.toBuffer('image/png');
}

async function generateLeaderboardCanvas(leaderboardData, guild) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#330033');
  gradient.addColorStop(1, '#660066');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);

  // Aura particles
  ctx.fillStyle = '#ffd70044';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ff3399';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mommy Role League Leaderboard', 400, 80);

  // Leaderboard entries
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  let yPos = 140;
  for (let i = 0; i < leaderboardData.length; i++) {
    const user = leaderboardData[i];
    const member = guild.members.cache.get(user.userId);
    const rank = ranks.find(r => r.name === user.rank) || ranks[0]; // Fallback to Baby Girl
    const displayName = member ? member.displayName : `Unknown (${user.userId})`;

    // Rank background
    ctx.fillStyle = i < 3 ? '#ffd70022' : '#ffffff11';
    drawRoundRect(ctx, 50, yPos - 30, 700, 40, 10);
    ctx.fill();

    // Text
    ctx.fillStyle = i < 3 ? '#ffd700' : '#e6e6e6';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${i + 1}. ${displayName}`, 70, yPos);
    ctx.fillStyle = rank.color;
    ctx.fillText(`${rank.emoji} ${user.rank}`, 400, yPos);
    ctx.fillStyle = '#e6e6e6';
    ctx.fillText(`${user.gloryPoints} GP`, 600, yPos);

    yPos += 50;
  }

  const buffer = canvas.toBuffer('image/png');
  if (!buffer || !(buffer instanceof Buffer)) {
    throw new Error('Failed to generate valid canvas buffer');
  }
  return buffer;
}

module.exports = { generateProfileCanvas, generateLeaderboardCanvas };