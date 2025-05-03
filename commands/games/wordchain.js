const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType,
    AttachmentBuilder
} = require("discord.js");
const axios = require('axios');
const Leaderboard = require('../util/leaderboard');

const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

class WordChainGame {
    constructor() {
        this.usedWords = new Set();
        this.lastWord = '';
        this.minWordLength = 2;
        this.maxWordLength = 45;
    }

    reset() {
        this.usedWords.clear();
        this.lastWord = '';
    }

    isValidFormat(word) {
        return (
            typeof word === 'string' &&
            word.length >= this.minWordLength &&
            word.length <= this.maxWordLength &&
            /^[a-zA-Z]+$/.test(word)
        );
    }

    followsChainRules(word) {
        word = word.toLowerCase();
        if (!this.lastWord || word[0] === this.lastWord.slice(-1)) {
            if (!this.usedWords.has(word)) {
                return { valid: true };
            }
            return { valid: false, reason: "This word has already been used in this game!" };
        }
        return { 
            valid: false, 
            reason: `Word must start with the letter '${this.lastWord.slice(-1).toUpperCase()}'!`
        };
    }

    addWord(word) {
        word = word.toLowerCase();
        this.usedWords.add(word);
        this.lastWord = word;
    }
}

async function isRealWord(word) {
    try {
        const response = await axios.get(`${DICTIONARY_API_URL}${word}`);
        return response.status === 200;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        console.error('Dictionary API error:', error);
        return true;
    }
}

module.exports = {
    name: "wordchain",
    description: "Start a Word Chain game!",
    async execute(message, args, client) { // Accept client as parameter
        let currentPlayers = new Set();
        let gameStarted = false;
        const game = new WordChainGame();
        const allPlayers = [];
        const eliminationOrder = []; // Track elimination order

        const embed = new EmbedBuilder()
            .setTitle("📝 Word Chain Game!")
            .setDescription("Click the Join button to participate!\n\n**Required Players:** 2-6 players\n**Time Remaining:** 30 seconds\n\n**Current Players:** 0/6")
            .setColor('DarkAqua');

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

        const gameMessage = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        const collector = gameMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000
        });

        collector.on('collect', async (interaction) => {
            if (gameStarted) {
                await interaction.reply({ content: "Game has already started!", ephemeral: true });
                return;
            }

            switch (interaction.customId) {
                case 'join_game':
                    if (currentPlayers.has(interaction.user.id)) {
                        await interaction.reply({ content: "You've already joined the game!", ephemeral: true });
                        return;
                    }
                    if (currentPlayers.size >= 10) {
                        await interaction.reply({ content: "Game is full! (10/10 players)", ephemeral: true });
                        return;
                    }
                    currentPlayers.add(interaction.user.id);
                    allPlayers.push({ id: interaction.user.id, username: interaction.user.username, wordsUsed: 0 });
                    await message.channel.send(`✅ ${interaction.user} has joined the game! (${currentPlayers.size}/10 players)`);
                    break;

                case 'leave_game':
                    if (!currentPlayers.has(interaction.user.id)) {
                        await interaction.reply({ content: "You haven't joined the game!", ephemeral: true });
                        return;
                    }
                    currentPlayers.delete(interaction.user.id);
                    const index = allPlayers.findIndex(p => p.id === interaction.user.id);
                    if (index !== -1) allPlayers.splice(index, 1);
                    await message.channel.send(`❌ ${interaction.user} has left the game! (${currentPlayers.size}/10 players)`);
                    break;

                case 'start_game':
                    if (interaction.user.id !== message.author.id) {
                        await interaction.reply({ content: "Only the game creator can start the game early!", ephemeral: true });
                        return;
                    }
                    if (currentPlayers.size < 2) {
                        await interaction.reply({ content: "Need at least 2 players to start!", ephemeral: true });
                        return;
                    }
                    collector.stop('gameStart');
                    break;
            }

            const timeLeft = Math.ceil((collector.options.time - (Date.now() - gameMessage.createdTimestamp)) / 1000);
            const updatedEmbed = EmbedBuilder.from(gameMessage.embeds[0])
                .setDescription(`Click the Join button to participate!\n\n**Required Players:** 2-6 players\n**Time Remaining:** ${timeLeft} seconds\n\n**Current Players:** ${currentPlayers.size}/6`);

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

        collector.on('end', async (collected, reason) => {
            if (currentPlayers.size < 2) {
                await gameMessage.edit({
                    components: [],
                    embeds: [EmbedBuilder.from(gameMessage.embeds[0]).setColor('Red')]
                });
                return message.channel.send("❌ Not enough players joined (minimum 2 players needed). Game cancelled!");
            }

            gameStarted = true;
            game.reset();

            await gameMessage.edit({
                components: [],
                embeds: [EmbedBuilder.from(gameMessage.embeds[0]).setColor('Green')]
            });

            const activePlayers = [...allPlayers];

            const playerListEmbed = new EmbedBuilder()
                .setTitle("👥 Final Players List")
                .setDescription(allPlayers.map((p, i) => `${i + 1}. ${p.username}`).join('\n'))
                .setFooter({ text: `Game starting in 5 seconds...` })
                .setColor('Green');
            
            await message.channel.send({ embeds: [playerListEmbed] });

            await new Promise(resolve => setTimeout(resolve, 5000));

            const rulesEmbed = new EmbedBuilder()
                .setTitle("📜 Word Chain Rules")
                .setDescription("1️⃣ Say a word starting with the last letter of the previous word.\n2️⃣ No repeating words!\n3️⃣ Only valid English words allowed.\n4️⃣ You have **10 seconds** to respond, or you're out!\n5️⃣ Last person standing wins!")
                .setColor('Yellow');
            
            await message.channel.send({ embeds: [rulesEmbed] });

            const startingWord = "Apple";
            game.addWord(startingWord);
            let playerTurn = 0;

            await message.channel.send(`🎮 **Game Started!** First word: **${startingWord}**`);
            
            while (activePlayers.length > 1) {
                const currentPlayer = activePlayers[playerTurn % activePlayers.length];
                await message.channel.send(`🔄 <@${currentPlayer.id}>'s turn! Say a word starting with **${game.lastWord.slice(-1).toUpperCase()}**. You have **10 seconds!**`);

                try {
                    const collectedWord = await message.channel.awaitMessages({
                        filter: m => m.author.id === currentPlayer.id,
                        time: 10000,
                        max: 1
                    });

                    if (!collectedWord.size) {
                        await message.channel.send(`⏳ **${currentPlayer.username}** didn't respond in time and is eliminated! ❌`);
                        eliminationOrder.push(activePlayers.splice(playerTurn % activePlayers.length, 1)[0]);
                        continue;
                    }

                    const word = collectedWord.first().content.trim();

                    if (!game.isValidFormat(word)) {
                        await message.channel.send(`🚫 **${currentPlayer.username}** used an invalid word format and is eliminated! Words must be ${game.minWordLength}-${game.maxWordLength} letters long and contain only letters. ❌`);
                        eliminationOrder.push(activePlayers.splice(playerTurn % activePlayers.length, 1)[0]);
                        continue;
                    }

                    const chainCheck = game.followsChainRules(word);
                    if (!chainCheck.valid) {
                        await message.channel.send(`🚫 **${currentPlayer.username}** is eliminated! ${chainCheck.reason} ❌`);
                        eliminationOrder.push(activePlayers.splice(playerTurn % activePlayers.length, 1)[0]);
                        continue;
                    }

                    const isValid = await isRealWord(word);
                    if (!isValid) {
                        await message.channel.send(`🚫 **${currentPlayer.username}** used a non-existent word and is eliminated! ❌`);
                        eliminationOrder.push(activePlayers.splice(playerTurn % activePlayers.length, 1)[0]);
                        continue;
                    }

                    game.addWord(word);
                    currentPlayer.wordsUsed += 1;
                    const originalPlayer = allPlayers.find(p => p.id === currentPlayer.id);
                    if (originalPlayer) originalPlayer.wordsUsed += 1;
                    await message.channel.send(`✅ Valid word: **${word}**`);
                    playerTurn++;

                } catch (error) {
                    await message.channel.send(`❌ **Error occurred!**`);
                    console.error(error);
                }
            }

            // Combine remaining players with eliminated ones in reverse elimination order
            const finalRanking = [...activePlayers, ...eliminationOrder.reverse()];
           

            const leaderboardBuffer = await Leaderboard.createLeaderboardImage(finalRanking, message.client);
            const leaderboardAttachment = new AttachmentBuilder(leaderboardBuffer, { name: 'leaderboard.png' });

            await message.channel.send({ 
                content: `🏆 **${activePlayers[0].username}** is the last one standing! Congrats! 🎉\nHere's the final leaderboard:`,
                files: [leaderboardAttachment] 
            });
        });
    }
};