const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const Marriage = require('../../models/marriage');
const { Children } = require('../../models/children');

module.exports = {
    name: 'tree',
    description: 'Generate an elegant family tree card with spouse on the left',
    async execute(message) {
        try {
            // Check for mentioned user, fallback to message author
            const targetUser = message.mentions.users.first() || message.author;

            const [marriage, children, parents] = await Promise.all([
                Marriage.findOne({
                    $or: [{ partner: targetUser.id }, { spouse: targetUser.id }],
                }),
                Children.find({ parent: targetUser.id }), // Children adopted by user
                Children.find({ child_id: targetUser.id }), // Parents who adopted user
            ]);

            // Check if target user has any family connections (parents, children, or spouse)
            if (!marriage && children.length === 0 && parents.length === 0) {
                const canvas = createCanvas(800, 400);
                const ctx = canvas.getContext('2d');
                await drawNoFamilyMessage(ctx, canvas.width, canvas.height, targetUser.username);
                const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'no_family.png' });
                await message.reply({ content: `📜 No family data found for ${targetUser.username}!`, files: [attachment] });
                return;
            }

            // Dynamic canvas size based on family size
            const familySize = parents.length + children.length + (marriage ? 1 : 0) + 1; // Target user + parents + children + spouse
            const canvasHeight = 300 + parents.length * 150 + 150; // Height for user, parents, and one row of children
            const canvasWidth = Math.max(900, 300 + children.length * 150 + (marriage ? 150 : 0)); // Width adjusts for children and spouse
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            await drawBackground(ctx, canvas.width, canvasHeight);

            await drawFamilyCard(ctx, canvas, targetUser, marriage, children, parents, message.client, message);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'family_card.png' });
            await message.reply({ content: `📜 ${targetUser.username}'s Family Card has been generated!`, files: [attachment] });
        } catch (error) {
            console.error('Family card error:', error);
            await message.reply('There was an error generating the family card. Please try again.');
        }
    },
};

async function drawNoFamilyMessage(ctx, width, height, username) {
    // Soft gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#E6ECEF');
    gradient.addColorStop(1, '#D6DFE5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle geometric lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Elegant card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    roundRect(ctx, width / 4, height / 4, width / 2, height / 2, 20, true);
    ctx.shadowBlur = 0;

    // Text
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(`No Family Found for ${username}`, width / 2, height / 2 - 20);
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('Connect with others to build your family!', width / 2, height / 2 + 20);
}

async function drawBackground(ctx, width, height) {
    // Luxurious radial gradient background
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    gradient.addColorStop(0, '#1E3A3F'); // Deep emerald center
    gradient.addColorStop(0.4, '#2A4B5A'); // Sapphire transition
    gradient.addColorStop(0.8, '#4A2F1D'); // Dark bronze
    gradient.addColorStop(1, '#1A120B'); // Rich black edge
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle parchment-like texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < width * height / 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillRect(x, y, 1, 1);
    }

    // Vignette effect for depth
    const vignette = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.5);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Ornate filigree frame
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'; // Soft gold
    ctx.lineWidth = 3;
    const frameMargin = 20;
    roundRect(ctx, frameMargin, frameMargin, width - 2 * frameMargin, height - 2 * frameMargin, 15, false, true);

    // Corner flourishes
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 2;
    const flourishSize = 60;
    for (let [x, y, xDir, yDir] of [
        [30, 30, 1, 1],
        [width - 30, 30, -1, 1],
        [30, height - 30, 1, -1],
        [width - 30, height - 30, -1, -1]
    ]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + flourishSize * xDir, y, x + flourishSize * xDir, y + flourishSize * yDir);
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x, y + flourishSize * yDir, x + flourishSize * xDir, y + flourishSize * yDir);
        ctx.stroke();
    }

    // Triple-layer border with glow
    ctx.shadowColor = 'rgba(212, 175, 55, 0.3)'; // Gold glow
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FFD700'; // Gold outer border
    ctx.lineWidth = 5;
    roundRect(ctx, 15, 15, width - 30, height - 30, 12, false, true);
    ctx.strokeStyle = '#B0BEC5'; // Silver middle border
    ctx.lineWidth = 3;
    roundRect(ctx, 20, 20, width - 40, height - 40, 10, false, true);
    ctx.strokeStyle = '#333333'; // Dark inner border
    ctx.lineWidth = 1;
    roundRect(ctx, 25, 25, width - 50, height - 50, 8, false, true);
    ctx.shadowBlur = 0;
}

async function drawFamilyCard(ctx, canvas, targetUser, marriage, children, parents, client, message) {
    const highlightUser = message.mentions.users.first() || targetUser;

    // Prepare family data
    let spouse = null;
    if (marriage) {
        const spouseId = marriage.partner === targetUser.id ? marriage.spouse : marriage.partner;
        spouse = await client.users.fetch(spouseId).catch(() => null);
    }

    const validChildren = children.filter(child => child.child_id);
    const childrenData = await Promise.all(validChildren.map(child => client.users.fetch(child.child_id).catch(() => null)));

    const validParents = parents.filter(parent => parent.parent);
    const parentsData = await Promise.all(validParents.map(parent => client.users.fetch(parent.parent).catch(() => null)));

    // Dynamic sizing based on family size
    const familySize = parentsData.length + childrenData.length + (spouse ? 1 : 0) + 1;
    const baseAvatarRadius = familySize <= 3 ? 50 : familySize <= 6 ? 40 : 30; // Larger avatars for smaller families
    const verticalSpacing = familySize <= 3 ? 150 : familySize <= 6 ? 130 : 110; // Vertical spacing for parents and children row
    const childHorizontalSpacing = Math.min(150, (canvas.width - 200) / (childrenData.length || 1)); // Horizontal spacing for children
    const spouseSpacing = 150; // Horizontal spacing for spouse
    const cardWidth = Math.max(600, childrenData.length * childHorizontalSpacing + (spouse ? spouseSpacing : 0) + 300); // Increased width by 200
    const cardHeight = 150 + parentsData.length * verticalSpacing + verticalSpacing + 100; // Increased height by 100
    const cardX = (canvas.width - cardWidth) / 2;
    const cardY = 50; // Fixed top position for better separation

    // Draw card with inner glow
    ctx.shadowColor = 'rgba(212, 175, 55, 0.2)'; // Soft gold glow
    ctx.shadowBlur = 20;
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
    cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    cardGradient.addColorStop(1, 'rgba(245, 245, 245, 0.9)');
    ctx.fillStyle = cardGradient;
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20, true);
    ctx.shadowBlur = 0;

    // Card border
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20, false, true);

    // Title
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText('Family Card', canvas.width / 2, cardY + 30); // Centered title

    // User (center)
    const userY = cardY + cardHeight / 2; // Centered vertically within card
    const userX = cardX + cardWidth / 2; // Centered horizontally within card
    await drawNode(ctx, userX, userY, baseAvatarRadius, targetUser, 'You', '#66BFBF', highlightUser.id === targetUser.id);

    // Spouse (left of user)
    if (spouse) {
        const spouseX = userX - spouseSpacing;
        await drawNode(ctx, spouseX, userY, baseAvatarRadius, spouse, 'Spouse', '#FF9999', highlightUser.id === spouse.id);
        drawDashedConnection(ctx, userX - baseAvatarRadius, userY, spouseX + baseAvatarRadius, userY, '#FF9999');
    }

    // Parents (above, vertically stacked, centered)
    let currentParentY = userY - verticalSpacing;
    for (let i = 0; i < parentsData.length; i++) {
        await drawNode(ctx, userX, currentParentY, baseAvatarRadius, parentsData[i], 'Parent', '#D4A017', highlightUser.id === parentsData[i].id);
        drawDashedConnection(ctx, userX, userY - baseAvatarRadius, userX, currentParentY + baseAvatarRadius, '#D4A017');
        currentParentY -= verticalSpacing; // Stack parents vertically
    }

    // Children (below, horizontally positioned, centered)
    if (childrenData.length > 0) {
        const childY = userY + verticalSpacing;
        const startX = userX - (childHorizontalSpacing * (childrenData.length - 1)) / 2;
        for (let i = 0; i < childrenData.length; i++) {
            const childX = startX + i * childHorizontalSpacing;
            await drawNode(ctx, childX, childY, baseAvatarRadius, childrenData[i], 'Child', '#C3B1E1', highlightUser.id === childrenData[i].id);
            drawDashedConnection(ctx, userX, userY + baseAvatarRadius, childX, childY - baseAvatarRadius, '#C3B1E1');
        }
    }
}

async function drawNode(ctx, x, y, radius, user, role, color, highlight) {
    // Node background
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // Avatar
    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png' }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, x - (radius - 5), y - (radius - 5), (radius - 5) * 2, (radius - 5) * 2);
        ctx.restore();
    } catch (err) {
        console.error('Error loading avatar:', err);
    }

    // Node border
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = highlight ? '#666666' : color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Text
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(user.username, x, y + radius + 20);
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(role, x, y + radius + 40);
}

function drawDashedConnection(ctx, x1, y1, x2, y2, color) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const cp1x = x1;
    const cp1y = y1 + (y2 - y1) / 2;
    const cp2x = x2;
    const cp2y = y2 - (y2 - y1) / 2;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.stroke();
    ctx.setLineDash([]); // Reset to solid line
    ctx.closePath();
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