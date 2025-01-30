const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, InteractionResponse } = require('discord.js');

module.exports = {
    name: 'rps',
    description: 'Play Rock Paper Scissors with another user!',
    async execute(message, args) {
        const opponent = message.mentions.users.first();
        if (!opponent) {
            return message.reply('Please mention a user to play with!');
        }

        if (opponent.bot) {
            return message.reply('You cannot play against a bot!');
        }
        if (opponent.id === message.author.id) {
            return message.reply('You cannot play against yourself!');
        }

        // Game state
        const gameState = {
            players: {
                [message.author.id]: {
                    user: message.author,
                    choice: null
                },
                [opponent.id]: {
                    user: opponent,
                    choice: null
                }
            },
            currentMessage: null,
            gameEnded: false
        };

        // Create choice buttons
        function createChoiceButtons() {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('rock')
                    .setLabel('🪨 Rock')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('paper')
                    .setLabel('📄 Paper')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('scissors')
                    .setLabel('✂️ Scissors')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        function determineWinner(choice1, choice2) {
            if (choice1 === choice2) return 'draw';
            
            const winConditions = {
                rock: 'scissors',
                paper: 'rock',
                scissors: 'paper'
            };

            return winConditions[choice1] === choice2 ? 'player1' : 'player2';
        }

        try {
            // Initial game invite
            const inviteEmbed = new EmbedBuilder()
                .setTitle('🎮 Rock Paper Scissors Challenge!')
                .setDescription(`${message.author} has challenged ${opponent} to a game!\n\n${opponent}, click the button below to accept.`)
                .setColor('#2f3136')
                .setFooter({ text: 'This invitation expires in 30 seconds' });

            const acceptButton = new ButtonBuilder()
                .setCustomId('accept_game')
                .setLabel('Accept Challenge')
                .setStyle(ButtonStyle.Success);

            const inviteRow = new ActionRowBuilder().addComponents(acceptButton);

            const inviteMessage = await message.channel.send({
                embeds: [inviteEmbed],
                components: [inviteRow]
            });

            // Handle game acceptance
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
            const gameEmbed = new EmbedBuilder()
                .setTitle('🎮 Rock Paper Scissors')
                .setDescription('Choose your move!')
                .addFields(
                    { name: message.author.username, value: '❓ Not chosen', inline: true },
                    { name: opponent.username, value: '❓ Not chosen', inline: true }
                )
                .setColor('#2f3136');

            // Store the game message for future updates
            gameState.currentMessage = await message.channel.send({
                embeds: [gameEmbed],
                components: [createChoiceButtons()]
            });

            // First update the acceptance message
            await acceptance.update({
                content: '🎮 Game Started!',
                embeds: [],
                components: []
            });

            // Handle choices
            const choiceFilter = i => {
                const isPlayer = i.user.id === message.author.id || i.user.id === opponent.id;
                const hasNotChosen = !gameState.players[i.user.id].choice;
                return isPlayer && hasNotChosen;
            };

            const collector = gameState.currentMessage.createMessageComponentCollector({
                filter: choiceFilter,
                time: 30000
            });

            collector.on('collect', async (interaction) => {
                const player = gameState.players[interaction.user.id];
                player.choice = interaction.customId;

                // Send private confirmation using flags
                await interaction.reply({
                    content: `You chose ${interaction.customId}!`,
                    flags: ['Ephemeral']
                });

                // Update game embed
                const updatedEmbed = new EmbedBuilder()
                    .setTitle('🎮 Rock Paper Scissors')
                    .setDescription('Choose your move!')
                    .addFields(
                        { 
                            name: message.author.username, 
                            value: gameState.players[message.author.id].choice ? '✅ Choice made' : '❓ Not chosen', 
                            inline: true 
                        },
                        { 
                            name: opponent.username, 
                            value: gameState.players[opponent.id].choice ? '✅ Choice made' : '❓ Not chosen', 
                            inline: true 
                        }
                    )
                    .setColor('#2f3136');

                await gameState.currentMessage.edit({
                    embeds: [updatedEmbed]
                });

                // Check if both players have made their choices
                if (gameState.players[message.author.id].choice && gameState.players[opponent.id].choice) {
                    collector.stop('complete');
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('⏰ Time\'s Up!')
                        .setDescription('Game cancelled - Players took too long to choose')
                        .setColor('#ff0000');

                    await message.channel.send({ embeds: [timeoutEmbed] });
                    return;
                }

                if (reason === 'complete') {
                    const p1Choice = gameState.players[message.author.id].choice;
                    const p2Choice = gameState.players[opponent.id].choice;
                    const result = determineWinner(p1Choice, p2Choice);

                    const resultEmbed = new EmbedBuilder()
                        .setTitle('🎮 Rock Paper Scissors - Results!')
                        .addFields(
                            { name: message.author.username, value: `chose ${p1Choice}`, inline: true },
                            { name: opponent.username, value: `chose ${p2Choice}`, inline: true }
                        )
                        .setColor('#2f3136');

                    if (result === 'draw') {
                        resultEmbed.setDescription("It's a draw! 🤝");
                    } else {
                        const winner = result === 'player1' ? message.author : opponent;
                        resultEmbed.setDescription(`${winner} wins! 🎉`);
                    }

                    await gameState.currentMessage.edit({
                        embeds: [resultEmbed],
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('Error in RPS command:', error);
            message.channel.send('❌ An error occurred while running the game. Please try again.');
        }
    }
};