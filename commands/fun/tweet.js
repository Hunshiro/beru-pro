const { Tweet } = require("canvafy");
const { Client, Message, AttachmentBuilder } = require("discord.js");

module.exports = {
    name: "tweet",
    description: "Generate a fake tweet",
    async execute(message, args) {
        const text = args.join(" ");
        if (!text) return message.reply("❌ Please provide a tweet text!");
        const displayname  = message.author.displayName;
        const username  = message.author.username;

        const tweet = new Tweet()
            .setAvatar(message.author.displayAvatarURL({ extension: "png" }))
            .setUser({displayName: displayname, username: username})
            .setVerified(true)


            
            .setComment(text);

        const image = await tweet.build();
        const attachment = new AttachmentBuilder(image, { name: "tweet.png" });

        message.reply({ files: [attachment] });
       
    }
   
};
