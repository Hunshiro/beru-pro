const Canvas = require('canvas');
const path = require('path');

class Leaderboard {
    constructor() {
        this.width = 1000;
        this.rowHeight = 90;
        this.headerSpace = 180;
    }

    async createLeaderboardImage(players, client) {
        const canvasHeight = this.headerSpace + players.length * this.rowHeight + 50;
        const canvas = Canvas.createCanvas(this.width, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Gradient Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#1E2A44');
        gradient.addColorStop(1, '#2C3E50');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, canvasHeight);

        // Header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText('🏆 Word Chain Leaderboard 🏆', this.width / 2, 80);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillText('🏆 Word Chain Leaderboard 🏆', this.width / 2, 80);

        // Column Headers
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#E0E0E0';
        ctx.fillText('Rank', 100, 140);
        ctx.fillText('Player', 400, 140);
        ctx.fillText('Words', 750, 140);

        const lineGradient = ctx.createLinearGradient(50, 150, this.width - 50, 150);
        lineGradient.addColorStop(0, '#FFD700');
        lineGradient.addColorStop(1, '#FFFFFF');
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 160);
        ctx.lineTo(this.width - 50, 160);
        ctx.stroke();

        // Render Players (in order of elimination, winner first)
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const yPos = this.headerSpace + i * this.rowHeight;

            ctx.fillStyle = i === 0 ? 'rgba(255, 215, 0, 0.8)' : // Winner
                          i === 1 ? 'rgba(192, 192, 192, 0.8)' : // Second place
                          i === 2 ? 'rgba(205, 127, 50, 0.8)' : // Third place
                          'rgba(54, 57, 63, 0.8)'; // Others
            ctx.beginPath();
            ctx.roundRect(50, yPos, this.width - 100, this.rowHeight - 10, 15);
            ctx.fill();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Avatar
            try {
                const member = await client.users.fetch(player.id);
                const avatarUrl = member.displayAvatarURL({ extension: 'png', size: 64 });
                // console.log(`Fetching avatar for ${player.username} (${player.id}): ${avatarUrl}`);
                const avatar = await Canvas.loadImage(avatarUrl);

                ctx.save();
                ctx.beginPath();
                ctx.arc(200, yPos + this.rowHeight / 2, 35, 0, Math.PI * 2);
                ctx.closePath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#FFFFFF';
                ctx.stroke();
                ctx.clip();
                ctx.drawImage(avatar, 165, yPos + this.rowHeight / 2 - 35, 70, 70);
                ctx.restore();
            } catch (error) {
                console.error(`Failed to load avatar for ${player.username} (${player.id}):`, error.message);
                console.error(error.stack);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(165, yPos + this.rowHeight / 2 - 35, 70, 70);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('N/A', 200, yPos + this.rowHeight / 2 + 8);
            }

            // Rank
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            const rankText = `${i + 1}${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}`;
            ctx.fillText(rankText, 100, yPos + this.rowHeight / 2 + 8);

            // Username
            ctx.font = 'bold 26px Arial';
            ctx.textAlign = 'left';
            ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
            ctx.shadowBlur = 3;
            ctx.fillText(player.username.slice(0, 20), 280, yPos + this.rowHeight / 2 + 8);
            ctx.shadowBlur = 0;

            // Words Used
            ctx.fillStyle = 'rgba(230, 87, 87, 0.2)';
            ctx.beginPath();
            ctx.roundRect(700, yPos + 20, 100, 40, 10);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${player.wordsUsed || 0}`, 750, yPos + 48);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'italic 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Powered by Rapcod- Word Chain Champions!', this.width / 2, canvasHeight - 20);

        return canvas.toBuffer();
    }
}

Canvas.CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
};

module.exports = new Leaderboard();