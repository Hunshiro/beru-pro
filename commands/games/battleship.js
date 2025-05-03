const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');

// Helper: create a 5x5 board filled with empty cells
function createBoard() {
  const size = 5;
  const board = [];
  for (let i = 0; i < size; i++) {
    board.push(new Array(size).fill('~'));
  }
  return board;
}

// Helper: create a 5x5 button grid
function createButtonGrid(board, prefix, disabled = false) {
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const actionRows = [];

  for (let i = 0; i < 5; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 5; j++) {
      const button = new ButtonBuilder()
        .setCustomId(`${prefix}_${i}_${j}`)
        .setLabel(board[i][j] === '~' ? '🌊' : board[i][j] === 'S' ? '🚢' : board[i][j] === 'X' ? '💥' : '❌')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled);
      row.addComponents(button);
    }
    actionRows.push(row);
  }
  return actionRows;
}

// Helper: format time remaining
function formatTimeRemaining(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

module.exports = {
  name: 'battleship',
  description: 'Play Battleship with buttons!',
  async execute(message, args) {
    const joinEmbed = new EmbedBuilder()
      .setTitle('🚢 Battleship Game')
      .setDescription('Click to join the game!\n*Two players required*')
      .setColor(0x3498db);

    const joinButton = new ButtonBuilder()
      .setCustomId('join_battleship')
      .setLabel('Join Game')
      .setStyle(ButtonStyle.Primary);

    const joinRow = new ActionRowBuilder().addComponents(joinButton);
    const joinMsg = await message.channel.send({ embeds: [joinEmbed], components: [joinRow] });

    const players = new Map();

    // Join collector
    const joinCollector = joinMsg.createMessageComponentCollector({
      filter: i => i.customId === 'join_battleship',
      componentType: ComponentType.Button,
      time: 30000
    });

    joinCollector.on('collect', async i => {
      if (players.has(i.user.id)) {
        await i.reply({ content: 'You already joined!', ephemeral: true });
        return;
      }
      if (players.size >= 2) {
        await i.reply({ content: 'Game is full!', ephemeral: true });
        return;
      }

      players.set(i.user.id, { 
        user: i.user,
        board: createBoard(),
        guessBoard: createBoard(),
        shipPlaced: false,
        guessesLeft: 3
      });

      await i.reply({ content: `Welcome to Battleship, ${i.user.username}!`, ephemeral: true });
      
      const joinedNames = Array.from(players.values()).map(p => p.user.username).join(' vs ');
      joinEmbed.setDescription(`Players: ${joinedNames}\nWaiting for ${2 - players.size} more player(s)...`);
      await joinMsg.edit({ embeds: [joinEmbed] });

      if (players.size === 2) joinCollector.stop('full');
    });

    joinCollector.on('end', async (_, reason) => {
      if (players.size < 2) {
        await joinMsg.edit({ 
          embeds: [joinEmbed.setDescription('❌ Not enough players joined. Game cancelled.')],
          components: [] 
        });
        return;
      }

      // Announce game start
      await message.channel.send('🎮 Game is starting! Players will be pinged for ship placement.');

      const [player1, player2] = Array.from(players.values());
      const gamePlayers = [player1, player2];

      // Ship placement phase
      for (const player of gamePlayers) {
        // Ping player for ship placement
        await message.channel.send(`${player.user}, it's your turn to place your ship! Check the ephemeral message below ⬇️`);

        const placementEmbed = new EmbedBuilder()
          .setTitle('🚢 Place Your Battleship!')
          .setDescription(`<@${player.user.id}>, select a square to place your ship.\n⏰ You have 5 seconds to choose.`)
          .setColor(0x2ecc71)
          .setFooter({ text: 'Click any square to place your ship' });

        const placementMsg = await message.channel.send({ 
          embeds: [placementEmbed],
          components: createButtonGrid(player.board, `place_${player.user.id}`),
          ephemeral: true,
          user: player.user
        });

        try {
          const response = await placementMsg.awaitMessageComponent({ 
            filter: i => i.user.id === player.user.id,
            time: 5000 
          });

          const [_, __, row, col] = response.customId.split('_');
          player.board[row][col] = 'S';
          player.shipPlaced = true;
          
          await response.update({ 
            embeds: [new EmbedBuilder()
              .setTitle('✅ Ship Placed!')
              .setDescription('Your ship has been positioned. Game will begin shortly.')
              .setColor(0x2ecc71)],
            components: createButtonGrid(player.board, 'place', true),
            ephemeral: true
          });

          await message.channel.send(`✅ ${player.user} has placed their ship!`);
        } catch (error) {
          const row = Math.floor(Math.random() * 5);
          const col = Math.floor(Math.random() * 5);
          player.board[row][col] = 'S';
          player.shipPlaced = true;
          
          await message.channel.send(`⏰ Time's up! ${player.user}'s ship was placed randomly.`);
        }
      }

      // Game phase
      let currentTurn = 0;
      
      const gameEmbed = new EmbedBuilder()
        .setTitle('🎮 Battleship - Game In Progress')
        .setDescription(`It's ${gamePlayers[currentTurn].user}'s turn!\n\n📊 Status:\n• Guesses remaining: ${gamePlayers[currentTurn].guessesLeft}\n• Click a square to make your guess!`)
        .setColor(0x2ecc71);

      // Initial game state announcement
      await message.channel.send(`⚔️ Let the battle begin!\n${gamePlayers[currentTurn].user}, you go first!`);

      const gameMsg = await message.channel.send({ 
        embeds: [gameEmbed],
        components: createButtonGrid(gamePlayers[currentTurn].guessBoard, 'guess')
      });

      const gameCollector = gameMsg.createMessageComponentCollector({
        filter: i => gamePlayers.some(p => p.user.id === i.user.id),
        time: 300000
      });

      // Timer for turn reminder
      let turnTimeout;
      const setTurnReminder = () => {
        clearTimeout(turnTimeout);
        turnTimeout = setTimeout(async () => {
          await message.channel.send(`⏰ Reminder: ${gamePlayers[currentTurn].user}, it's your turn! You have ${gamePlayers[currentTurn].guessesLeft} guesses left.`);
        }, 15000); // Remind after 15 seconds of inactivity
      };
      setTurnReminder();

      gameCollector.on('collect', async i => {
        clearTimeout(turnTimeout); // Clear existing reminder

        if (i.user.id !== gamePlayers[currentTurn].user.id) {
          await i.reply({ content: '❌ Not your turn!', ephemeral: true });
          return;
        }

        const [_, row, col] = i.customId.split('_');
        const opponent = gamePlayers[(currentTurn + 1) % 2];

        if (gamePlayers[currentTurn].guessBoard[row][col] !== '~') {
          await i.reply({ content: '❌ You already guessed that square!', ephemeral: true });
          return;
        }

        if (opponent.board[row][col] === 'S') {
          gamePlayers[currentTurn].guessBoard[row][col] = 'X';
          gameCollector.stop('winner');
          
          const winEmbed = new EmbedBuilder()
            .setTitle('🎉 Game Over - Winner!')
            .setDescription(`Congratulations ${gamePlayers[currentTurn].user}! You found the enemy ship!`)
            .setColor(0x2ecc71);

          await i.update({
            embeds: [winEmbed],
            components: createButtonGrid(gamePlayers[currentTurn].guessBoard, 'guess', true)
          });

          await message.channel.send(`🎉 Game Over! ${gamePlayers[currentTurn].user} wins!`);
          return;
        } else {
          gamePlayers[currentTurn].guessBoard[row][col] = 'O';
          gamePlayers[currentTurn].guessesLeft--;

          if (gamePlayers[currentTurn].guessesLeft === 0) {
            currentTurn = (currentTurn + 1) % 2;
            if (gamePlayers[currentTurn].guessesLeft === 0) {
              gameCollector.stop('draw');
              
              const drawEmbed = new EmbedBuilder()
                .setTitle('🤝 Game Over - Draw!')
                .setDescription('Both players used all their guesses without finding the ships!')
                .setColor(0xf1c40f);

              await i.update({
                embeds: [drawEmbed],
                components: createButtonGrid(gamePlayers[currentTurn].guessBoard, 'guess', true)
              });

              await message.channel.send('🤝 Game Over! It\'s a draw - both players used all their guesses!');
              return;
            }
          }

          const nextPlayer = gamePlayers[currentTurn];
          await i.update({
            embeds: [gameEmbed.setDescription(`Miss! ${nextPlayer.user}'s turn!\n\n📊 Status:\n• Guesses remaining: ${nextPlayer.guessesLeft}\n• Click a square to make your guess!`)],
            components: createButtonGrid(nextPlayer.guessBoard, 'guess')
          });

          await message.channel.send(`❌ Miss! ${nextPlayer.user}, it's your turn! You have ${nextPlayer.guessesLeft} guesses left.`);
          setTurnReminder(); // Set reminder for next player
        }
      });

      gameCollector.on('end', (_, reason) => {
        clearTimeout(turnTimeout); // Clear any existing reminder
        if (reason === 'time') {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Game Over - Time Expired')
            .setDescription('The game has ended due to inactivity.')
            .setColor(0xe74c3c);

          gameMsg.edit({
            embeds: [timeoutEmbed],
            components: createButtonGrid(gamePlayers[currentTurn].guessBoard, 'guess', true)
          });

          message.channel.send('⏰ Game Over! The game has ended due to inactivity.');
        }
      });
    });
  }
};