const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

// Game constants
const WIDTH = 7;
const HEIGHT = 6;
const EMPTY = '⚪';
const PLAYER1 = '🔴';
const PLAYER2 = '🟡';
const GAME_TIMEOUT = 300000; // 5 minutes
const BUTTONS_PER_ROW = 5; // Discord's limit for buttons per row

class Connect4Game {
    constructor(message, opponent) {
        this.message = message;
        this.player1 = message.author;
        this.player2 = opponent;
        this.board = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(EMPTY));
        this.currentPlayer = this.player1;
        this.currentPiece = PLAYER1;
        this.gameMessage = null;
        this.collector = null;
        this.isGameActive = true;
    }

    generateBoardString() {
        const columnNumbers = Array.from({ length: WIDTH }, (_, i) => `${i + 1}`).join('');
        return `${columnNumbers}\n${this.board.map(row => row.join('')).join('\n')}`;
    }

    generateButtons() {
        const rows = [];
        for (let i = 0; i < WIDTH; i += BUTTONS_PER_ROW) {
            const row = new ActionRowBuilder().addComponents(
                ...Array.from(
                    { length: Math.min(BUTTONS_PER_ROW, WIDTH - i) },
                    (_, index) => {
                        const columnIndex = i + index;
                        return new ButtonBuilder()
                            .setCustomId(`drop_${columnIndex}`)
                            .setLabel((columnIndex + 1).toString())
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!this.isGameActive);
                    }
                )
            );
            rows.push(row);
        }
        return rows;
    }

    checkWin(row, col) {
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal right
            [1, -1]  // diagonal left
        ];

        return directions.some(([dr, dc]) => {
            let count = 1;
            // Check forward direction
            for (let i = 1; i < 4; i++) {
                const nr = row + dr * i;
                const nc = col + dc * i;
                if (!this.isValidPosition(nr, nc) || this.board[nr][nc] !== this.currentPiece) break;
                count++;
            }
            // Check backward direction
            for (let i = 1; i < 4; i++) {
                const nr = row - dr * i;
                const nc = col - dc * i;
                if (!this.isValidPosition(nr, nc) || this.board[nr][nc] !== this.currentPiece) break;
                count++;
            }
            return count >= 4;
        });
    }

    isValidPosition(row, col) {
        return row >= 0 && row < HEIGHT && col >= 0 && col < WIDTH;
    }

    checkDraw() {
        return this.board[0].every(cell => cell !== EMPTY);
    }

    getEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('🎮 Connect 4')
            .setDescription(this.generateBoardString())
            .setColor('#00FFFF')
            .addFields(
                { name: 'Player 1', value: `${this.player1.username} ${PLAYER1}`, inline: true },
                { name: 'Player 2', value: `${this.player2.username} ${PLAYER2}`, inline: true }
            );

        if (!this.isGameActive) {
            embed.setFooter({ text: 'Game ended' });
        } else {
            embed.setFooter({ text: `Turn: ${this.currentPlayer.username}` });
        }

        return embed;
    }

    async makeMove(interaction) {
        if (!this.isGameActive) {
            await interaction.reply({ content: "This game has ended!", ephemeral: true });
            return;
        }

        if (interaction.user.id !== this.currentPlayer.id) {
            await interaction.reply({ content: "It's not your turn!", ephemeral: true });
            return;
        }

        const column = parseInt(interaction.customId.split('_')[1]);
        let row = HEIGHT - 1;

        while (row >= 0 && this.board[row][column] !== EMPTY) row--;

        if (row < 0) {
            await interaction.reply({ content: "This column is full!", ephemeral: true });
            return;
        }

        // Make the move
        this.board[row][column] = this.currentPiece;

        // Check win condition
        if (this.checkWin(row, column)) {
            this.isGameActive = false;
            const embed = this.getEmbed()
                .setDescription(this.generateBoardString())
                .setFooter({ text: `${this.currentPlayer.username} wins! 🎉` });
            await interaction.update({ embeds: [embed], components: this.generateButtons() });
            return;
        }

        // Check draw condition
        if (this.checkDraw()) {
            this.isGameActive = false;
            const embed = this.getEmbed()
                .setDescription(this.generateBoardString())
                .setFooter({ text: "It's a draw! 🤝" });
            await interaction.update({ embeds: [embed], components: this.generateButtons() });
            return;
        }

        // Switch players
        this.currentPlayer = this.currentPlayer.id === this.player1.id ? this.player2 : this.player1;
        this.currentPiece = this.currentPiece === PLAYER1 ? PLAYER2 : PLAYER1;

        await interaction.update({
            embeds: [this.getEmbed()],
            components: this.generateButtons()
        });
    }
}

module.exports = {
    name: 'connect4',
    description: 'Play Connect 4 with another user!',
    async execute(message, args) {
        try {
            const opponent = message.mentions.users.first();
            
            if (!opponent) {
                return message.reply('Please mention someone to play with!');
            }

            if (opponent.bot) {
                return message.reply("You can't play against a bot!");
            }

            if (opponent.id === message.author.id) {
                return message.reply("You can't play against yourself!");
            }

            const game = new Connect4Game(message, opponent);

            // Send initial game message
            const gameMessage = await message.channel.send({
                content: `${opponent}, you've been challenged to a game of Connect 4 by ${message.author}!`,
                embeds: [game.getEmbed()],
                components: game.generateButtons()
            });

            // Create collector for button interactions
            const collector = gameMessage.createMessageComponentCollector({
                time: GAME_TIMEOUT
            });

            collector.on('collect', async (interaction) => {
                await game.makeMove(interaction);
                if (!game.isGameActive) {
                    collector.stop();
                }
            });

            collector.on('end', (_, reason) => {
                if (reason === 'time' && game.isGameActive) {
                    game.isGameActive = false;
                    const embed = game.getEmbed()
                        .setFooter({ text: 'Game ended due to inactivity ⏰' });
                    gameMessage.edit({
                        embeds: [embed],
                        components: game.generateButtons()
                    });
                }
            });

        } catch (error) {
            console.error('Error in Connect 4 command:', error);
            message.channel.send('An error occurred while setting up the game. Please try again.');
        }
    }
};