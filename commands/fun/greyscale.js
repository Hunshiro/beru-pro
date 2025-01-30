const { AttachmentBuilder } = require("discord.js");
const canvafy = require("canvafy");

module.exports = {
    name: "grey",
    description: "Morphs the user's avatar with a grey effect.",
    async execute(message) {
        try {
            // Get the target user (mentioned user or message author)
            const user = message.mentions.users.first() || message.author;

            // Get the user's avatar
            const avatarURL = user.displayAvatarURL({ extension: "png", size: 512 });

            // Apply the beauty effect
            const image = await canvafy.Image.greyscale(avatarURL);

            // Create an attachment
            const attachment = new AttachmentBuilder(image, { name: "beauty.png" });

            // Send the image
            message.reply({ content: `✨ **${user.username}**,ooh no.... 😔`, files: [attachment] });

        } catch (error) {
            console.error(error);
            message.reply("❌ Oops! Something went wrong while processing the image.");
        }
    },
};
