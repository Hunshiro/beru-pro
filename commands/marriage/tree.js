const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const Marriage = require('../../models/marriage');
const { Children } = require('../../models/children');

module.exports = {
    name: 'tree',
    description: 'Generate a dynamic family tree visualization',
    async execute(message) {
        try {
            const canvas = createCanvas(1500, 1000);
            const ctx = canvas.getContext('2d');

            await drawBackground(ctx, canvas.width, canvas.height);

            // Fetch marriage and children data
            const [marriage, children] = await Promise.all([
                Marriage.findOne({
                    $or: [{ partner: message.author.id }, { spouse: message.author.id }],
                }),
                Children.find({ parent: message.author.id }),
            ]);

            await drawFamilyTree(ctx, canvas, message.author, marriage, children, message.client, message);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'family_tree.png' });
            await message.reply({ content: '🎋 Your Family Tree has been generated!', files: [attachment] });
        } catch (error) {
            console.error('Tree command error:', error);
            await message.reply('There was an error generating your family tree. Please try again.');
        }
    },
};

async function drawBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1c2c');
    gradient.addColorStop(1, '#222b3d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }

    const margin = 20;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
}

async function drawFamilyTree(ctx, canvas, author, marriage, children, client, message) {
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Rapcod Family Tree', canvas.width / 2, 100);

    const cardWidth = 300;
    const cardHeight = 150;
    const centerY = 200;

    let mainUserX = canvas.width / 2 - (marriage ? cardWidth + 50 : cardWidth / 2);
    const highlightUser = message.mentions.users.first() || author;

    await drawMemberCard(ctx, mainUserX, centerY, cardWidth, cardHeight, {
        name: author.username,
        role: '👑 Family Head',
        avatar: author.displayAvatarURL({ extension: 'png' }),
        color: '#4169E1',
        highlight: highlightUser.id === author.id, // Highlight if it’s the author or mentioned user
    });

    if (marriage) {
        const spouseId = marriage.partner === author.id ? marriage.spouse : marriage.partner;
        const spouse = await client.users.fetch(spouseId);

        drawMarriageConnection(ctx, mainUserX + cardWidth, centerY + cardHeight / 2, 100);

        await drawMemberCard(ctx, mainUserX + cardWidth + 100, centerY, cardWidth, cardHeight, {
            name: spouse.username,
            role: '👑 Spouse',
            avatar: spouse.displayAvatarURL({ extension: 'png' }),
            color: '#FF69B4',
            highlight: highlightUser.id === spouse.id, // Highlight spouse if mentioned
        });

        // Display children below the parents (if any)
        if (children.length > 0) {
            const childrenStartY = centerY + cardHeight + 100;
            const spacing = Math.min((canvas.width - 200) / children.length, cardWidth + 50);
            const startX = (canvas.width - (spacing * (children.length - 1) + cardWidth)) / 2;

            drawChildrenConnections(ctx, canvas.width / 2, centerY + cardHeight, startX + cardWidth / 2, childrenStartY, children.length, spacing);

            // Fetch child data and display them
            const validChildren = children.filter(child => child.child_id);
            const childrenData = await Promise.all(validChildren.map(child => client.users.fetch(child.child_id).catch(() => null)));

            for (let i = 0; i < validChildren.length; i++) {
                const child = childrenData[i];

                if (!child) continue; // Skip if failed to fetch child data

                const childX = startX + spacing * i;
                await drawMemberCard(ctx, childX, childrenStartY, cardWidth, cardHeight, {
                    name: child.username,
                    avatar: child.displayAvatarURL({ extension: 'png' }),
                    role: '👶 Child',
                    color: '#32CD32',
                    highlight: highlightUser.id === child.id, // Highlight child if mentioned
                });

                // Optionally, you can display spouse of children (if any)
                // Add spouse relation for children here, if needed
            }
        }
    }
}

async function drawMemberCard(ctx, x, y, width, height, { name, role, avatar, color, highlight }) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, x, y, width, height, 15, true);

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = highlight ? '#FFD700' : color; // Highlight the card with gold if user is mentioned
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, width, height, 15, false, true);

    if (avatar) {
        try {
            const avatarImg = await loadImage(avatar);
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + width / 2, y + 50, 30, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarImg, x + width / 2 - 30, y + 20, 60, 60);
            ctx.restore();
        } catch (error) {
            console.error('Error loading avatar:', error);
        }
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(name, x + width / 2, y + 100);
    ctx.fillStyle = color;
    ctx.font = '20px Arial';
    ctx.fillText(role, x + width / 2, y + 130);
}

function drawMarriageConnection(ctx, startX, startY, length) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + length, startY);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawChildrenConnections(ctx, parentX, parentY, childStartX, childY, childCount, spacing) {
    ctx.beginPath();
    ctx.moveTo(parentX, parentY);
    ctx.lineTo(parentX, childY - 50);
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 6;
    ctx.stroke();

    if (childCount > 1) {
        ctx.beginPath();
        ctx.moveTo(childStartX, childY - 50);
        ctx.lineTo(childStartX + (spacing * (childCount - 1)), childY - 50);
        ctx.stroke();
    }

    for (let i = 0; i < childCount; i++) {
        ctx.beginPath();
        ctx.moveTo(childStartX + spacing * i, childY - 50);
        ctx.lineTo(childStartX + spacing * i, childY);
        ctx.stroke();
    }
}

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
