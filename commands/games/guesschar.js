const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

module.exports = {
    name: "gc",
    description: "Guess the Anime Character!",
    async execute(message, args) {
        try {
            // Generate a random character ID between 1 and 250000
            const randomCharacterId = Math.floor(Math.random() * 250000) + 1;

            const query = `
            query ($id: Int) {
                Character(id: $id) {
                    name {
                        full
                    }
                    image {
                        large
                    }
                    media(perPage: 1) {
                        nodes {
                            title {
                                romaji
                            }
                        }
                    }
                }
            }`;

            const variables = { id: randomCharacterId };

            const response = await axios.post("https://graphql.anilist.co", {
                query,
                variables
            });

            const character = response.data.data.Character;

            if (!character || !character.name || !character.image) {
                return message.channel.send("⚠️ Couldn't fetch a valid character, try again!");
            }

            const characterName = character.name.full;
            const characterImage = character.image.large;
            const animeTitle = character.media.nodes.length > 0 ? character.media.nodes[0].title.romaji : "Unknown Anime";

            const embed = new EmbedBuilder()
                .setTitle("🧐 Guess the Anime Character!")
                .setDescription("You have **30 seconds** to guess!")
                .setImage(characterImage)
                .setColor("Blue");

            await message.channel.send({ embeds: [embed] });

            const filter = m => !m.author.bot;
            let guessedCorrectly = false;

            // Hint 1: Number of letters
            await new Promise(resolve => setTimeout(async () => {
                if (!guessedCorrectly) {
                    await message.channel.send(`💡 Hint 1: The name has **${characterName.length}** letters.`);
                }
                resolve();
            }, 10000));

            // Hint 2: First letter
            await new Promise(resolve => setTimeout(async () => {
                if (!guessedCorrectly) {
                    await message.channel.send(`💡 Hint 2: The name starts with **"${characterName[0]}"**.`);
                }
                resolve();
            }, 20000));

            // Hint 3: Anime Name
            await new Promise(resolve => setTimeout(async () => {
                if (!guessedCorrectly) {
                    await message.channel.send(`💡 Final Hint: This character is from **"${animeTitle}"**.`);
                }
                resolve();
            }, 25000));

            // Wait for player responses
            const collected = await message.channel.awaitMessages({ filter, time: 30000, max: 1 });

            if (!collected.size) {
                return message.channel.send(`⏳ Time's up! The correct answer was **${characterName}**.`);
            }

            const guess = collected.first().content.toLowerCase();

            if (guess === characterName.toLowerCase()) {
                guessedCorrectly = true;
                return message.channel.send(`🎉 **${collected.first().author.username}** guessed it right! The character was **${characterName}**!`);
            } else {
                return message.channel.send(`❌ Wrong guess! The correct answer was **${characterName}**.`);
            }

        } catch (error) {
            console.error(error);
            message.channel.send("⚠️ Error fetching character data. Try again later!");
        }
    }
};
