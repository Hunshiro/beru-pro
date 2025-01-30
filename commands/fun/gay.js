const { AttachmentBuilder } = require("discord.js");
const canvafy = require("canvafy");

module.exports = {
    name: "gay",
    description: " Morphs the user's avatar with a gay effect.",
    async execute(message) {
        try {
            // Get the target user (mentioned user or message author)
            const user = message.mentions.users.first()

            // Get the user's avatar
            const avatar2 = message.author.displayAvatarURL({ extension: "png", size: 512 });
            const avatarURL = user.displayAvatarURL({ extension: "png", size: 512 });

            // Apply the beauty effect
            const image = await canvafy.Image.kiss(avatarURL,avatar2);

            // Create an attachment
            const attachment = new AttachmentBuilder(image, { name: "beauty.png" });

            // Send the image
            message.reply({ content: `✨ thats so gay ${user.username}`, files: [attachment] });

        } catch (error) {
            console.error(error);
            message.reply("❌ Oops! Something went wrong while processing the image.");
        }
    },
};
