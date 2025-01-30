const { Collection } = require('discord.js');

const afkUsers = new Collection();

module.exports = {
    name: 'afk',
    description: 'Set your AFK status',
    async execute(message, args) {
        const reason = args.join(' ') || 'No reason provided';
        
        // Store the AFK status
        afkUsers.set(message.author.id, {
            reason,
            timestamp: Date.now(),
        });

        await message.reply(`✅ You are now AFK: **${reason}**`);

        // Listen for messages to remove AFK status when they return
        const filter = (m) => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 86400000 }); // 24 hours

        collector.on('collect', (msg) => {
            if (afkUsers.has(msg.author.id)) {
                afkUsers.delete(msg.author.id);
                msg.reply('✅ Welcome back! I removed your AFK status.');
                collector.stop();
            }
        });
    },
};

// Event Listener to check mentions
module.exports.checkMentions = async (message) => {
    if (message.mentions.users.size > 0) {
        message.mentions.users.forEach(user => {
            if (afkUsers.has(user.id)) {
                const { reason, timestamp } = afkUsers.get(user.id);
                const timeAgo = Math.floor((Date.now() - timestamp) / 60000); // Convert to minutes
                message.reply(`⏳ ${user.username} is AFK: **${reason}** (since ${timeAgo} mins ago)`);
            }
        });
    }
};
