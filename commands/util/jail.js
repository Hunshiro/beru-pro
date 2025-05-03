// jail.js
const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  name: 'jail',
  description: 'Put the mentioned user behind bars!',
  async execute(message, args) {
    // Get the first mentioned user
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a user to jail.');
    }

    // Retrieve the user's avatar URL as a PNG image (256x256)
    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
    // Cloudinary URL for the overlay image; force PNG output with ?fm=png
    const overlayURL =
      'https://res.cloudinary.com/dwhkjrluc/image/upload/v1738567431/pngwing.com_1_vsucep.png?fm=png';

    // Define canvas dimensions (matching the overlay image dimensions)
    const canvasSize = 256;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    try {
      // Load the user's avatar using loadImage (should be supported)
      const avatar = await loadImage(avatarURL);
      ctx.drawImage(avatar, 0, 0, canvasSize, canvasSize);

      // Fetch the overlay image as a buffer using the global fetch API
      const overlayResponse = await fetch(overlayURL);
      if (!overlayResponse.ok) {
        throw new Error(
          `Failed to fetch overlay image: ${overlayResponse.statusText}`
        );
      }

      // Get the response as an ArrayBuffer and convert it to a Node Buffer
      const overlayArrayBuffer = await overlayResponse.arrayBuffer();
      const overlayBuffer = Buffer.from(overlayArrayBuffer);

      // Convert the overlay buffer to a Base64 data URL
      const base64Overlay = overlayBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Overlay}`;

      // Load the overlay image using the data URL
      const overlayImage = await loadImage(dataUrl);
      ctx.drawImage(overlayImage, 0, 0, canvasSize, canvasSize);

      // Create an attachment from the canvas buffer
      const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: 'jailed.png',
      });

      return message.channel.send({
        content: `${user.displayName} is now behind bars!`,
        files: [attachment],
      });
    } catch (error) {
      console.error('Error creating jail image:', error);
      return message.reply('There was an error generating the jail image.');
    }
  },
};
