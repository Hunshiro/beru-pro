// wordgame.js
const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ComponentType 
  } = require('discord.js');
  
  // If you're using Node.js version older than v18, uncomment the following line:
  // const fetch = require('node-fetch');
  
  module.exports = {
    name: 'wordgame',
    description: 'Play a word game! Type as many valid words as you can that start with a given letter in 30 seconds.',
    async execute(message, args) {
      // Set up game state
      const players = new Map(); // Map of userId => { count, username }
      const maxPlayers = 2;
      
      // Build the initial embed inviting players to join
      const startEmbed = new EmbedBuilder()
        .setTitle('📝 Word Game')
        .setDescription('Click the button below to join the game!\n\n*Only 2 players can join.*')
        .setColor(0x00AE86)
        .setTimestamp();
  
      // Create the join button using ButtonBuilder
      const joinButton = new ButtonBuilder()
        .setCustomId('wordgame_join')
        .setLabel('Join Game')
        .setStyle(ButtonStyle.Primary);
  
      const joinRow = new ActionRowBuilder().addComponents(joinButton);
  
      // Send the initial embed with join button
      const joinMessage = await message.channel.send({
        embeds: [startEmbed],
        components: [joinRow],
      });
  
      // Create a collector for the join button interactions
      const joinFilter = (interaction) => interaction.customId === 'wordgame_join';
      const joinCollector = joinMessage.createMessageComponentCollector({
        filter: joinFilter,
        componentType: ComponentType.Button,
        time: 30000, // allow 30 seconds for joining
      });
  
      joinCollector.on('collect', async (interaction) => {
        // Check if user already joined
        if (players.has(interaction.user.id)) {
          return interaction.reply({ content: 'You have already joined the game!', ephemeral: true });
        }
        // Only allow two players
        if (players.size >= maxPlayers) {
          return interaction.reply({ content: 'The game is full!', ephemeral: true });
        }
        // Add the player to the game
        players.set(interaction.user.id, { count: 0, username: interaction.user.username });
        await interaction.reply({ content: `You have joined the game, ${interaction.user.username}!`, ephemeral: true });
        
        // Update the embed to show joined players
        const joinedUsernames = Array.from(players.values()).map(p => p.username).join(' vs ');
        startEmbed.setDescription(`Players: **${joinedUsernames}**\n\nWaiting for ${maxPlayers - players.size} more player(s)...`);
        await joinMessage.edit({ embeds: [startEmbed] });
  
        // If two players have joined, stop collecting and start the game
        if (players.size === maxPlayers) {
          joinCollector.stop('full');
        }
      });
  
      joinCollector.on('end', async (_, reason) => {
        // If the game did not get enough players, cancel it
        if (players.size < maxPlayers) {
          const cancelEmbed = new EmbedBuilder()
            .setTitle('Game Cancelled')
            .setDescription('Not enough players joined in time.')
            .setColor(0xff5555)
            .setTimestamp();
          // Disable the join button
          const disabledRow = new ActionRowBuilder().addComponents(
            ButtonBuilder.from(joinButton).setDisabled(true)
          );
          return joinMessage.edit({ embeds: [cancelEmbed], components: [disabledRow] });
        }
  
        // Disable the join button (game is now starting)
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(joinButton).setDisabled(true)
        );
        await joinMessage.edit({ components: [disabledRow] });
  
        // Pick a random letter from A-Z
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
  
        // Update the embed to show the game has started
        const gameEmbed = new EmbedBuilder()
          .setTitle('📝 Word Game Started!')
          .setDescription(`Players: **${Array.from(players.values()).map(p => p.username).join(' vs ')}**\n\n**Your letter is:** **${randomLetter}**\nYou have **30 seconds** to send as many valid words as possible that start with **${randomLetter}**.`)
          .setColor(0x00AE86)
          .setTimestamp();
        await joinMessage.edit({ embeds: [gameEmbed] });
  
        // Set up a message collector to count valid words from the two players
        const wordFilter = (msg) => players.has(msg.author.id);
        const wordCollector = message.channel.createMessageCollector({ filter: wordFilter, time: 30000 });
  
        wordCollector.on('collect', async (msg) => {
          const content = msg.content.trim();
          // Only consider messages that are a single word with only alphabetical characters
          if (!content || !/^[a-zA-Z]+$/.test(content)) return;
          if (content[0].toUpperCase() !== randomLetter) return;
          
          // Check word validity using the Dictionary API
          try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${content.toLowerCase()}`);
            if (!response.ok) {
              // Word not found in dictionary
              return;
            }
            const data = await response.json();
            if (!Array.isArray(data) || data.title === "No Definitions Found") {
              // The API did not return valid definitions
              return;
            }
            // If valid, increase the player's count
            const playerData = players.get(msg.author.id);
            playerData.count++;
            players.set(msg.author.id, playerData);
          } catch (error) {
            console.error(`Error checking word validity: ${error}`);
            // On error, simply skip counting this word.
          }
        });
  
        wordCollector.on('end', async () => {
          // After 30 seconds, determine the winner
          const results = Array.from(players.entries()).map(([id, data]) => {
            return { id, username: data.username, count: data.count };
          });
  
          // Sort players by count (descending)
          results.sort((a, b) => b.count - a.count);
  
          let resultDescription = results.map((p) => `**${p.username}**: ${p.count} valid word(s)`).join('\n');
          let winnerText = '';
  
          // Check for tie or a clear winner
          if (results.length > 1 && results[0].count === results[1].count) {
            winnerText = 'It\'s a tie!';
          } else {
            winnerText = `The winner is **${results[0].username}**!`;
          }
  
          // Build the final results embed
          const resultEmbed = new EmbedBuilder()
            .setTitle('📝 Word Game Results')
            .setDescription(`${resultDescription}\n\n${winnerText}`)
            .setColor(0x00AE86)
            .setTimestamp();
  
          await message.channel.send({ embeds: [resultEmbed] });
        });
      });
    },
  };
  