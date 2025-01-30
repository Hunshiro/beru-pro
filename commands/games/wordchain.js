const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const wordChain = new Map();
const validWords = new Set();
const alphabetRegex = /^[a-zA-Z]+$/;

module.exports = {
    name: "wordchain",
    description: "Start a Word Chain game!",
    async execute(message, args) {
        // Initialize game state
        let currentPlayers = new Set();
        let gameStarted = false;

        const embed = new EmbedBuilder()
            .setTitle("📝 Word Chain Game!")
            .setDescription("Click the Join button to participate!\n\n**Required Players:** 2-6 players\n**Time Remaining:** 30 seconds\n\n**Current Players:** 0/6")
            .setColor('DarkAqua');

        // Create buttons
        const joinButton = new ButtonBuilder()
            .setCustomId('join_game')
            .setLabel('Join Game')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎮');

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave_game')
            .setLabel('Leave Game')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('👋');

        const startButton = new ButtonBuilder()
            .setCustomId('start_game')
            .setLabel('Start Game')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('▶️')
            .setDisabled(true);

        const row = new ActionRowBuilder()
            .addComponents(joinButton, leaveButton, startButton);

        // Send initial message with buttons
        const gameMessage = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        // Create button collector
        const collector = gameMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000
        });

        // Handle button interactions
        collector.on('collect', async (interaction) => {
            if (gameStarted) {
                await interaction.reply({ 
                    content: "Game has already started!", 
                    ephemeral: true 
                });
                return;
            }

            switch (interaction.customId) {
                case 'join_game':
                    if (currentPlayers.has(interaction.user.id)) {
                        await interaction.reply({ 
                            content: "You've already joined the game!", 
                            ephemeral: true 
                        });
                        return;
                    }

                    if (currentPlayers.size >= 6) {
                        await interaction.reply({ 
                            content: "Game is full! (6/6 players)", 
                            ephemeral: true 
                        });
                        return;
                    }

                    currentPlayers.add(interaction.user.id);
                    await message.channel.send(`✅ ${interaction.user} has joined the game! (${currentPlayers.size}/6 players)`);
                    break;

                case 'leave_game':
                    if (!currentPlayers.has(interaction.user.id)) {
                        await interaction.reply({ 
                            content: "You haven't joined the game!", 
                            ephemeral: true 
                        });
                        return;
                    }

                    currentPlayers.delete(interaction.user.id);
                    await message.channel.send(`❌ ${interaction.user} has left the game! (${currentPlayers.size}/6 players)`);
                    break;

                case 'start_game':
                    if (interaction.user.id !== message.author.id) {
                        await interaction.reply({ 
                            content: "Only the game creator can start the game early!", 
                            ephemeral: true 
                        });
                        return;
                    }

                    if (currentPlayers.size < 2) {
                        await interaction.reply({ 
                            content: "Need at least 2 players to start!", 
                            ephemeral: true 
                        });
                        return;
                    }

                    collector.stop('gameStart');
                    break;
            }

            // Update embed and buttons
            const timeLeft = Math.ceil((collector.options.time - (Date.now() - collector.createTimestamp)) / 1000);
            const updatedEmbed = EmbedBuilder.from(gameMessage.embeds[0])
                .setDescription(`Click the Join button to participate!\n\n**Required Players:** 2-6 players\n**Time Remaining:** ${timeLeft} seconds\n\n**Current Players:** ${currentPlayers.size}/6`);

            // Update start button state
            const updatedRow = new ActionRowBuilder()
                .addComponents(
                    joinButton,
                    leaveButton,
                    new ButtonBuilder()
                        .setCustomId('start_game')
                        .setLabel('Start Game')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('▶️')
                        .setDisabled(currentPlayers.size < 2)
                );

            await gameMessage.edit({
                embeds: [updatedEmbed],
                components: [updatedRow]
            });

            await interaction.deferUpdate();
        });

        // Handle collection end
        collector.on('end', async (collected, reason) => {
            const players = Array.from(currentPlayers).map(id => message.guild.members.cache.get(id)).filter(Boolean);
            
            if (players.length < 2) {
                await gameMessage.edit({
                    components: [],
                    embeds: [EmbedBuilder.from(gameMessage.embeds[0]).setColor('Red')]
                });
                return message.channel.send("❌ Not enough players joined (minimum 2 players needed). Game cancelled!");
            }

            gameStarted = true;

            // Disable all buttons
            await gameMessage.edit({
                components: [],
                embeds: [EmbedBuilder.from(gameMessage.embeds[0]).setColor('Green')]
            });

            const playerList = players.map((player, index) => ({ 
                id: player.id, 
                username: player.user.username, 
                number: index + 1 
            }));

            // Final player list embed
            const playerListEmbed = new EmbedBuilder()
                .setTitle("👥 Final Players List")
                .setDescription(playerList.map(p => `${p.number}. ${p.username}`).join('\n'))
                .setFooter({ text: `Game starting in 5 seconds...` })
                .setColor('Green');
            
            await message.channel.send({ embeds: [playerListEmbed] });

            // Wait 5 seconds before starting
            await new Promise(resolve => setTimeout(resolve, 5000));

            const rulesEmbed = new EmbedBuilder()
                .setTitle("📜 Word Chain Rules")
                .setDescription("1️⃣ Say a word starting with the last letter of the previous word.\n2️⃣ No repeating words!\n3️⃣ Only valid English words allowed.\n4️⃣ You have **10 seconds** to respond, or you're out!\n5️⃣ Last person standing wins!")
                .setColor('Yellow');
            
            await message.channel.send({ embeds: [rulesEmbed] });

            // Start the game
            const startingWord = "Apple";
            validWords.add(startingWord.toLowerCase());
            let playerTurn = 0;

            await message.channel.send(`🎮 **Game Started!** First word: **${startingWord}**`);
            let lastLetter = startingWord.slice(-1).toLowerCase();

            while (playerList.length > 1) {
                const currentPlayer = playerList[playerTurn % playerList.length];
                await message.channel.send(`🔄 **${currentPlayer.username}'s turn!** Say a word starting with **${lastLetter.toUpperCase()}**. You have **10 seconds!**`);

                try {
                    const collectedWord = await message.channel.awaitMessages({
                        filter: m => m.author.id === currentPlayer.id,
                        time: 10000,
                        max: 1
                    });

                    if (!collectedWord.size) {
                        await message.channel.send(`⏳ **${currentPlayer.username}** didn't respond in time and is eliminated! ❌`);
                        playerList.splice(playerTurn % playerList.length, 1);
                        continue;
                    }

                    const word = collectedWord.first().content.trim().toLowerCase();

                    if (!alphabetRegex.test(word) || validWords.has(word) || word[0] !== lastLetter) {
                        await message.channel.send(`🚫 **${currentPlayer.username}** used an invalid word and is eliminated! ❌`);
                        playerList.splice(playerTurn % playerList.length, 1);
                        continue;
                    }

                    validWords.add(word);
                    lastLetter = word.slice(-1);
                    playerTurn++;
                } catch (error) {
                    await message.channel.send(`❌ **Error occurred!**`);
                    console.error(error);
                }
            }

            await message.channel.send(`🏆 **${playerList[0].username}** is the last one standing! Congrats! 🎉`);
        });
    }
};