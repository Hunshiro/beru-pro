const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'ttt',
    description: 'Start a Tic-Tac-Toe game with another user!',
    async execute(message, args) {
        // Check if a user is mentioned
        const opponent = message.mentions.users.first();
        if (!opponent) {
            return message.reply('Please mention a user to play with! Usage: `!ttt <@user>`');
        }

        // Additional validation checks
        if (opponent.bot) {
            return message.reply('You cannot play against a bot!');
        }
        if (opponent.id === message.author.id) {
            return message.reply('You cannot play against yourself!');
        }

        // Initialize game state
        const gameState = {
            board: Array(9).fill(''),
            currentPlayer: message.author,
            players: {
                X: message.author,
                O: opponent
            },
            turn: 'X',
            gameEnded: false
        };

        // Create the Tic-Tac-Toe grid with buttons
        function createBoard() {
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const row = new ActionRowBuilder();
                const buttons = [];
                for (let j = 0; j < 3; j++) {
                    const index = i * 3 + j;
                    const button = new ButtonBuilder()
                        .setCustomId(`cell_${index}`)
                        .setLabel(gameState.board[index] || '⠀') // Using Unicode blank character
                        .setStyle(getButtonStyle(gameState.board[index]))
                        .setDisabled(gameState.gameEnded || gameState.board[index] !== '');
                    buttons.push(button);
                }
                row.addComponents(buttons);
                rows.push(row);
            }
            return rows;
        }

        function getButtonStyle(value) {
            if (!value) return ButtonStyle.Secondary;
            return value === 'X' ? ButtonStyle.Primary : ButtonStyle.Danger;
        }

        // Check for win condition
        function checkWinner() {
            const winPatterns = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
                [0, 4, 8], [2, 4, 6] // Diagonals
            ];

            for (const pattern of winPatterns) {
                const [a, b, c] = pattern;
                if (gameState.board[a] && 
                    gameState.board[a] === gameState.board[b] && 
                    gameState.board[a] === gameState.board[c]) {
                    return gameState.board[a];
                }
            }

            return gameState.board.every(cell => cell !== '') ? 'draw' : null;
        }

        // Create game invite embed
        const inviteEmbed = new EmbedBuilder()
            .setTitle('🎮 Tic-Tac-Toe Challenge!')
            .setDescription(`${message.author} has challenged ${opponent} to a game!\n\n${opponent}, click the button below to accept.`)
            .setColor('#2f3136')
            .setFooter({ text: 'This invitation expires in 30 seconds' });

        const acceptButton = new ButtonBuilder()
            .setCustomId('accept_game')
            .setLabel('Accept Challenge')
            .setStyle(ButtonStyle.Success);

        const inviteRow = new ActionRowBuilder().addComponents(acceptButton);

        // Send invite and handle acceptance
        try {
            const inviteMessage = await message.channel.send({
                embeds: [inviteEmbed],
                components: [inviteRow]
            });

            const acceptFilter = i => i.user.id === opponent.id && i.customId === 'accept_game';
            const acceptance = await inviteMessage.awaitMessageComponent({
                filter: acceptFilter,
                time: 30000
            }).catch(() => null);

            if (!acceptance) {
                await inviteMessage.edit({
                    content: '❌ Game invitation expired',
                    embeds: [],
                    components: []
                });
                return;
            }

            // Start the game
            await acceptance.update({
                content: '🎮 Game Started!',
                embeds: [],
                components: []
            });

            const gameEmbed = new EmbedBuilder()
                .setTitle('Tic-Tac-Toe')
                .setDescription(`Current turn: ${gameState.currentPlayer} (${gameState.turn})`)
                .setColor('#2f3136');

            const gameMessage = await message.channel.send({
                embeds: [gameEmbed],
                components: createBoard()
            });

            // Handle game moves
            const moveCollector = gameMessage.createMessageComponentCollector({
                filter: i => !gameState.gameEnded && 
                            i.user.id === gameState.currentPlayer.id,
                time: 300000 // 5 minute game limit
            });

            moveCollector.on('collect', async (interaction) => {
                const index = parseInt(interaction.customId.split('_')[1]);

                if (gameState.board[index] !== '') {
                    await interaction.reply({
                        content: '❌ This cell is already taken!',
                        ephemeral: true
                    });
                    return;
                }

                // Update game state
                gameState.board[index] = gameState.turn;
                const winner = checkWinner();

                if (winner) {
                    gameState.gameEnded = true;
                    const resultEmbed = new EmbedBuilder()
                        .setTitle('Game Over!')
                        .setDescription(
                            winner === 'draw' 
                                ? "It's a draw! 🤝"
                                : `${gameState.players[winner]} (${winner}) wins! 🎉`
                        )
                        .setColor(winner === 'draw' ? '#2f3136' : '#00ff00');

                    await gameMessage.edit({
                        embeds: [resultEmbed],
                        components: createBoard()
                    });
                    moveCollector.stop();
                } else {
                    // Switch turns
                    gameState.turn = gameState.turn === 'X' ? 'O' : 'X';
                    gameState.currentPlayer = gameState.players[gameState.turn];

                    const turnEmbed = new EmbedBuilder()
                        .setTitle('Tic-Tac-Toe')
                        .setDescription(`Current turn: ${gameState.currentPlayer} (${gameState.turn})`)
                        .setColor('#2f3136');

                    await gameMessage.edit({
                        embeds: [turnEmbed],
                        components: createBoard()
                    });
                }

                await interaction.deferUpdate();
            });

            moveCollector.on('end', (collected, reason) => {
                if (reason === 'time' && !gameState.gameEnded) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('Game Over')
                        .setDescription('⏰ Game ended due to inactivity!')
                        .setColor('#ff0000');

                    gameMessage.edit({
                        embeds: [timeoutEmbed],
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('Error in tictactoe command:', error);
            message.channel.send('❌ An error occurred while running the game. Please try again.');
        }
    },
};