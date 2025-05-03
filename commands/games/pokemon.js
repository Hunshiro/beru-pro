// const { EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const fetch = require('node-fetch');

// module.exports = {
//     name: 'pokemon',
//     description: 'Start a Pokemon guessing game!',
//     async execute(message) {
//         // Configuration
//         const config = {
//             token: 'MTczODM5MzkxMQ.4IwkDk8oBgVcXkYiAQK2jZiMWUxt5tfh.d1a21f5eb5bd3e98', // Replace with your token
//             maxAttempts: 3,
//             timeout: 60000, // 60 seconds
//             embedColor: '#0099ff'
//         };

//         let attempts = 0;
//         let hints = [];

//         // Helper function to create the game embed
//         function createGameEmbed(pokemon, type = 'question') {
//             const embed = new EmbedBuilder()
//                 .setColor(config.embedColor)
//                 .setTimestamp();

//             switch (type) {
//                 case 'question':
//                     embed.setTitle('👾 Who\'s That Pokemon?')
//                         .addFields(
//                             { name: '🏷️ Type', value: pokemon.type, inline: true },
//                             { name: '💫 Abilities', value: pokemon.abilities, inline: true },
//                             { name: '📝 Instructions', value: 'Type your guess in the chat\nUse buttons for hints\nClick "Give Up" to end the game' }
//                         )
//                         .setImage(pokemon.questionImage)
//                         .setFooter({ 
//                             text: `Attempts Remaining: ${config.maxAttempts - attempts} | Time: ${config.timeout / 1000}s` 
//                         });
//                     break;

//                 case 'win':
//                     embed.setTitle('🎉 You Guessed It Right!')
//                         .setDescription(`✨ It was **${pokemon.name}**!`)
//                         .setAuthor({ 
//                             name: message.author.tag, 
//                             iconURL: message.author.displayAvatarURL() 
//                         })
//                         .setImage(pokemon.answerImage)
//                         .setURL(pokemon.link);
//                     break;

//                 case 'lose':
//                     embed.setTitle('❌ Game Over!')
//                         .setDescription(`💫 The Pokemon was **${pokemon.name}**!`)
//                         .setAuthor({ 
//                             name: message.author.tag, 
//                             iconURL: message.author.displayAvatarURL() 
//                         })
//                         .setImage(pokemon.answerImage)
//                         .setURL(pokemon.link);
//                     break;
//             }

//             return embed;
//         }

//         // Helper function to create hint buttons
//         function createButtons() {
//             return new ActionRowBuilder()
//                 .addComponents(
//                     new ButtonBuilder()
//                         .setCustomId('hint_firstLetter')
//                         .setLabel('First Letter')
//                         .setStyle(ButtonStyle.Primary)
//                         .setDisabled(hints.includes('firstLetter')),
//                     new ButtonBuilder()
//                         .setCustomId('hint_length')
//                         .setLabel('Name Length')
//                         .setStyle(ButtonStyle.Primary)
//                         .setDisabled(hints.includes('length')),
//                     new ButtonBuilder()
//                         .setCustomId('hint_lastLetter')
//                         .setLabel('Last Letter')
//                         .setStyle(ButtonStyle.Primary)
//                         .setDisabled(hints.includes('lastLetter')),
//                     new ButtonBuilder()
//                         .setCustomId('stop_game')
//                         .setLabel('Give Up')
//                         .setStyle(ButtonStyle.Danger)
//                 );
//         }

//         // Helper function to get hints
//         function getHint(pokemon, hintType) {
//             if (hints.includes(hintType)) return 'Hint already used!';

//             hints.push(hintType);
            
//             switch (hintType) {
//                 case 'firstLetter':
//                     return `🔍 The Pokemon's name starts with "${pokemon.name[0].toUpperCase()}"`;
//                 case 'length':
//                     return `📏 The Pokemon's name has ${pokemon.name.length} letters`;
//                 case 'lastLetter':
//                     return `🔍 The Pokemon's name ends with "${pokemon.name[pokemon.name.length - 1]}"`;
//                 default:
//                     return 'Invalid hint type!';
//             }
//         }

//         try {
//             // Fetch Pokemon data
//             const response = await fetch('https://api.dagpi.xyz/data/wtp', {
//                 headers: { 'Authorization': config.token }
//             });
            
//             if (!response.ok) {
//                 throw new Error(`API Error: ${response.status} ${response.statusText}`);
//             }

//             const data = await response.json();
            
//             // Format Pokemon data
//             const pokemon = {
//                 name: data.Data.name,
//                 type: data.Data.Type,
//                 abilities: data.Data.abilities,
//                 link: data.Data.Link,
//                 questionImage: data.question,
//                 answerImage: data.answer
//             };

//             // Send initial game message
//             const gameMessage = await message.channel.send({ 
//                 embeds: [createGameEmbed(pokemon, 'question')],
//                 components: [createButtons()]
//             });

//             // Create collectors for messages and buttons
//             const messageCollector = gameMessage.channel.createMessageCollector({
//                 filter: m => m.author.id === message.author.id,
//                 time: config.timeout
//             });

//             const buttonCollector = gameMessage.createMessageComponentCollector({
//                 componentType: ComponentType.Button,
//                 time: config.timeout
//             });

//             // Handle button interactions
//             buttonCollector.on('collect', async (interaction) => {
//                 if (interaction.user.id !== message.author.id) {
//                     await interaction.reply({ 
//                         content: '❌ This is not your game!', 
//                         ephemeral: true 
//                     });
//                     return;
//                 }

//                 if (interaction.customId === 'stop_game') {
//                     messageCollector.stop('giveup');
//                     buttonCollector.stop();
//                     return;
//                 }

//                 const hintMessage = getHint(pokemon, interaction.customId.replace('hint_', ''));
//                 await interaction.update({ 
//                     embeds: [createGameEmbed(pokemon, 'question')],
//                     components: [createButtons()]
//                 });
//                 await interaction.followUp({
//                     content: hintMessage,
//                     ephemeral: true
//                 });
//             });

//             // Handle guess messages
//             messageCollector.on('collect', async (msg) => {
//                 const guess = msg.content.toLowerCase();

//                 if (guess === pokemon.name.toLowerCase()) {
//                     messageCollector.stop('win');
//                     return;
//                 }

//                 attempts++;
//                 if (attempts >= config.maxAttempts) {
//                     messageCollector.stop('lose');
//                     return;
//                 }

//                 await msg.channel.send({
//                     content: `❌ Wrong guess! You have ${config.maxAttempts - attempts} attempts remaining!`
//                 });
//             });

//             // Handle game end
//             messageCollector.on('end', async (_, reason) => {
//                 buttonCollector.stop();
//                 const finalEmbed = createGameEmbed(
//                     pokemon, 
//                     reason === 'win' ? 'win' : 'lose'
//                 );

//                 await gameMessage.edit({ 
//                     embeds: [finalEmbed], 
//                     components: [] 
//                 });
//             });

//         } catch (error) {
//             console.error('Pokemon Game Error:', error);
//             await message.channel.send('❌ An error occurred while starting the game. Please try again later.');
//         }
//     }
// };