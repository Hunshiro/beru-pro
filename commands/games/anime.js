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
    name: "anime",
    description: "Get details about an anime!",
    async execute(message, args) {
        if (!args.length) return message.channel.send("❌ Please provide an anime name!");

        const animeName = args.join(" ");
        const query = `
        query ($search: String) {
            Media(search: $search, type: ANIME) {
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    large
                }
                description
                episodes
                status
                genres
                averageScore
                siteUrl
            }
        }`;

        try {
            const response = await axios.post("https://graphql.anilist.co", {
                query,
                variables: { search: animeName }
            });

            const anime = response.data.data.Media;
            if (!anime) return message.channel.send("❌ Anime not found!");

            const embed = new EmbedBuilder()
                .setTitle(anime.title.english || anime.title.romaji)
                .setURL(anime.siteUrl)
                .setDescription(anime.description.replace(/<[^>]*>/g, "").slice(0, 300) + "...")
                .setThumbnail(anime.coverImage.large)
                .addFields(
                    { name: "📺 Episodes", value: anime.episodes ? `${anime.episodes}` : "Unknown", inline: true },
                    { name: "📊 Score", value: anime.averageScore ? `${anime.averageScore}/100` : "N/A", inline: true },
                    { name: "📜 Status", value: anime.status.replace("_", " "), inline: true },
                    { name: "🎭 Genres", value: anime.genres.join(", ") }
                )
                .setColor("Purple");

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.channel.send("⚠️ Error fetching anime details. Try again later!");
        }
    }
};
