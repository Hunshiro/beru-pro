const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType
  } = require('discord.js');
  
  module.exports = {
    name: 'fight',
    description: 'Start a fight with another user!',
    async execute(message, args) {
      // Check if a user was mentioned
      const opponent = message.mentions.users.first();
      if (!opponent || opponent.bot) {
        return message.reply('🚫 Please mention a valid user to fight!');
      }
      if (opponent.id === message.author.id) {
        return message.reply("🤔 You can't fight yourself!");
      }
  
      // Define initial game state with additional properties
      const players = {
        [message.author.id]: {
          user: message.author,
          health: 100,
          shield: 0,
          specialUsed: false,
          lastMove: null
        },
        [opponent.id]: {
          user: opponent,
          health: 100,
          shield: 0,
          specialUsed: false,
          lastMove: null
        }
      };
  
      let turnId = Math.random() < 0.5 ? message.author.id : opponent.id;
      let turnCount = 1;
  
      // Enhanced health bar with shield indication
      const getHealthBar = (health, shield) => {
        const totalBars = 10;
        const filledBars = Math.round((health / 100) * totalBars);
        const shieldBars = Math.round((shield / 100) * totalBars);
        const emptyBars = totalBars - filledBars;
        
        return '❤️'.repeat(filledBars) + 
               (shield > 0 ? '🛡️'.repeat(shieldBars) : '') + 
               '⬛'.repeat(emptyBars) + 
               ` (${health}${shield > 0 ? ` + ${shield} shield` : ''})`;
      };
  
      // Get move description
      const getMoveDescription = (moveId, damage) => {
        const moves = {
          'fight_kick': `👢 Kicked for ${damage} damage!`,
          'fight_punch': `👊 Punched for ${damage} damage!`,
          'fight_special': `⚡ Used special attack for ${damage} damage!`,
          'fight_defend': '🛡️ Raised their shield!',
          'fight_heal': '💚 Used healing potion!'
        };
        return moves[moveId] || 'Made a move!';
      };
  
      // Create initial embed
      const createEmbed = () => {
        const player1 = players[message.author.id];
        const player2 = players[opponent.id];
        
        let description = `**Round ${turnCount}**\n`;
        description += `${player1.lastMove ? `\n${player1.user.username} ${player1.lastMove}` : ''}`;
        description += `${player2.lastMove ? `\n${player2.user.username} ${player2.lastMove}` : ''}`;
  
        const embed = new EmbedBuilder()
          .setTitle('⚔️ Epic Battle!')
          .setDescription(description);
  
        // Add fields with proper object structure
        embed.addFields([
          { 
            name: player1.user.username, 
            value: getHealthBar(player1.health, player1.shield), 
            inline: false 
          },
          { 
            name: player2.user.username, 
            value: getHealthBar(player2.health, player2.shield), 
            inline: false 
          }
        ]);
  
        embed.setFooter({ text: `Turn ${turnCount} • ${players[turnId].user.username}'s turn!` })
             .setColor(turnId === message.author.id ? 0x3498db : 0xe74c3c)
             .setTimestamp();
  
        return embed;
      };
  
      // Create buttons with cooldown indicators
      const createButtons = (currentPlayer) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('fight_punch')
            .setLabel('👊 Punch (15 dmg)')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('fight_kick')
            .setLabel('👢 Kick (10 dmg)')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('fight_special')
            .setLabel('⚡ Special (25 dmg)')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(currentPlayer.specialUsed),
          new ButtonBuilder()
            .setCustomId('fight_defend')
            .setLabel('🛡️ Defend')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('fight_heal')
            .setLabel('💚 Heal')
            .setStyle(ButtonStyle.Success)
        );
      };
  
      // Send initial message
      const fightMessage = await message.channel.send({ 
        embeds: [createEmbed()], 
        components: [createButtons(players[turnId])] 
      });
  
      // Create collector
      const collector = fightMessage.createMessageComponentCollector({
        filter: (interaction) => {
          if (!Object.keys(players).includes(interaction.user.id)) return false;
          if (interaction.user.id !== turnId) {
            interaction.reply({ content: "❌ It's not your turn!", ephemeral: true });
            return false;
          }
          return true;
        },
        componentType: ComponentType.Button,
        time: 60000
      });
  
      collector.on('collect', async (interaction) => {
        await interaction.deferUpdate();
        
        const currentPlayer = players[turnId];
        const opponentId = Object.keys(players).find(id => id !== turnId);
        const opponent = players[opponentId];
        let damage = 0;
  
        // Process moves
        switch (interaction.customId) {
          case 'fight_kick':
            damage = 10;
            if (opponent.shield > 0) {
              damage = Math.max(damage - opponent.shield, 0);
              opponent.shield = Math.max(opponent.shield - damage, 0);
            }
            opponent.health = Math.max(opponent.health - damage, 0);
            currentPlayer.lastMove = getMoveDescription('fight_kick', damage);
            break;
  
          case 'fight_punch':
            damage = 15;
            if (opponent.shield > 0) {
              damage = Math.max(damage - opponent.shield, 0);
              opponent.shield = Math.max(opponent.shield - damage, 0);
            }
            opponent.health = Math.max(opponent.health - damage, 0);
            currentPlayer.lastMove = getMoveDescription('fight_punch', damage);
            break;
  
          case 'fight_special':
            if (!currentPlayer.specialUsed) {
              damage = 25;
              if (opponent.shield > 0) {
                damage = Math.max(damage - opponent.shield, 0);
                opponent.shield = Math.max(opponent.shield - damage, 0);
              }
              opponent.health = Math.max(opponent.health - damage, 0);
              currentPlayer.specialUsed = true;
              currentPlayer.lastMove = getMoveDescription('fight_special', damage);
            }
            break;
  
          case 'fight_defend':
            currentPlayer.shield = Math.min(currentPlayer.shield + 15, 30);
            currentPlayer.lastMove = getMoveDescription('fight_defend');
            break;
  
          case 'fight_heal':
            const healAmount = 20;
            currentPlayer.health = Math.min(currentPlayer.health + healAmount, 100);
            currentPlayer.lastMove = getMoveDescription('fight_heal');
            break;
        }
  
        // Check for winner
        if (opponent.health <= 0) {
          const winEmbed = new EmbedBuilder()
            .setTitle('🏆 Victory!')
            .setDescription(`**${currentPlayer.user.username}** wins the battle!\n\n${currentPlayer.lastMove}`);
  
          // Add fields with proper object structure
          winEmbed.addFields([
            {
              name: players[message.author.id].user.username,
              value: getHealthBar(players[message.author.id].health, players[message.author.id].shield),
              inline: false
            },
            {
              name: players[opponent.id].user.username,
              value: getHealthBar(players[opponent.id].health, players[opponent.id].shield),
              inline: false
            }
          ]);
  
          winEmbed.setColor(0x2ecc71)
                  .setTimestamp();
  
          await fightMessage.edit({ embeds: [winEmbed], components: [] });
          collector.stop('game over');
          return;
        }
  
        // Switch turns and update UI
        turnId = opponentId;
        turnCount++;
        await fightMessage.edit({ 
          embeds: [createEmbed()], 
          components: [createButtons(players[turnId])]
        });
      });
  
      collector.on('end', async (_, reason) => {
        if (reason !== 'game over') {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Battle Timeout')
            .setDescription('The fight was abandoned due to inactivity.');
  
          // Add fields with proper object structure
          timeoutEmbed.addFields([
            {
              name: players[message.author.id].user.username,
              value: getHealthBar(players[message.author.id].health, players[message.author.id].shield),
              inline: false
            },
            {
              name: players[opponent.id].user.username,
              value: getHealthBar(players[opponent.id].health, players[opponent.id].shield),
              inline: false
            }
          ]);
  
          timeoutEmbed.setColor(0x95a5a6)
                      .setTimestamp();
  
          const disabledButtons = new ActionRowBuilder().addComponents(
            createButtons(players[turnId]).components.map(button => 
              ButtonBuilder.from(button).setDisabled(true)
            )
          );
  
          await fightMessage.edit({ 
            embeds: [timeoutEmbed], 
            components: [disabledButtons] 
          });
        }
      });
    },
  };