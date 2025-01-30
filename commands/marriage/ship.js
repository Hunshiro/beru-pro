const { Ship } = require("canvafy");
const { AttachmentBuilder } = require("discord.js");

module.exports = {
    name: "ship",
    description: "Ship users with a love percentage",
    async execute(message, args) {
        let user1, user2;
        
        if (args.length === 2) {
            user1 = message.mentions.users.first();
            user2 = message.mentions.users.at(1);
        } else if (args.length === 1) {
            user1 = message.author;
            user2 = message.mentions.users.first();
        } else {
            user1 = message.author;
            user2 = message.guild.members.cache
                .filter(m => m.id !== message.author.id)
                .random().user;
        }

        if (!user2) {
            return message.reply("❌ Please mention a valid user to ship!");
        }
           const avatar1 = user1.displayAvatarURL({ extension: "png" });
           const avatar2 = user2.displayAvatarURL({ extension: "png" });
           const img  = 'https://res.cloudinary.com/dwhkjrluc/image/upload/v1738213717/lovee_mvqbp1.jpg'
        const lovePercentage = Math.floor(Math.random() * 101);

      


    
        const ship = new Ship()
            .setAvatars(avatar1, avatar2)
            .setBackground("image",img)
        
            // .setTitle(`${user1.username} ❤️ ${user2.username}`)
            .setCustomNumber(lovePercentage);

        const image = await ship.build();
        const attachment = new AttachmentBuilder(image, { name: "ship.png" });
        if (lovePercentage === 100) {
            message.reply({ 
                content: `💞 **100% Love!** \n**${user1.username}** & **${user2.username}** are a perfect match! 💍✨ Wedding invitations are on the way! 💖🎊`, 
                files: [attachment] 
            });
        } else if (lovePercentage >= 90) {
            message.reply({ 
                content: `🔥 **${lovePercentage}% Love!** \n**${user1.username}** & **${user2.username}** are a power couple! 💕 Your love could melt the coldest heart! 🥰❤️`, 
                files: [attachment] 
            });
        } else if (lovePercentage >= 80) {
            message.reply({ 
                content: `😍 **${lovePercentage}% Love!**\n **${user1.username}** & **${user2.username}** have a love story worthy of a rom-com! 🎬💘 Sparks are flying! ✨`, 
                files: [attachment] 
            });
        } else if (lovePercentage >= 70) {
            message.reply({ 
                content: `😊 **${lovePercentage}% Love!**\n **${user1.username}** & **${user2.username}** have a strong connection! 💑 Just a little push, and it’s a fairy tale! 📖✨`, 
                files: [attachment] 
            });
        } else if (lovePercentage >= 50) {
            message.reply({ 
                content: `🤔 **${lovePercentage}% Love!**\n **${user1.username}** & **${user2.username}** are on the fence... 🤷‍♂️ Will it be romance or just friendship? Only time will tell! ⏳💖`, 
                files: [attachment] 
            });
        } else if (lovePercentage >= 30) {
            message.reply({ 
                content: `😅 **${lovePercentage}% Love!**\n **${user1.username}** & **${user2.username}** have a connection… kinda. 🚢 But this ship is rocking in rough waters! 🌊💔`, 
                files: [attachment] 
            });
        } else if (lovePercentage >= 10) {
            message.reply({ 
                content: `💔 **${lovePercentage}% Love!** \n **${user1.username}** & **${user2.username}**, um... this might not be the love story of the century. Maybe besties instead? 🫣`, 
                files: [attachment] 
            });
        } else {
            message.reply({ 
                content: `💀 **${user1.username}** & **${user2.username}** = **${lovePercentage}% Love!** 🚨 ABANDON SHIP! 🚢⚡ This love boat just hit an iceberg... ❄️💔 It’s sinking faster than the Titanic!`, 
                files: [attachment] 
            });
        }
        
        
        
    }
};
