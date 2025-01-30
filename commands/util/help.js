const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Recursively load all commands from the commands directory, including subfolders.
 * @param {string} dirPath - The path to the commands directory.
 * @returns {Array} List of commands with their names and descriptions.
 */
const loadCommands = (dirPath) => {
  const commands = [];
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      // Recursively load commands from subdirectories
      commands.push(...loadCommands(filePath));
    } else if (file.endsWith('.js')) {
      const command = require(filePath);
      if (command.name && command.description) {
        commands.push({ name: command.name, description: command.description });
      } else {
        console.warn(`Skipping invalid command file: ${filePath}`);
      }
    }
  }

  return commands;
};

module.exports = {
  name: 'help',
  description: 'Displays a list of all available commands.',
  execute: async (message) => {
    try {
      const commandsPath = path.join(__dirname, '..'); // Adjust to your commands base directory
      const commands = loadCommands(commandsPath);

      if (commands.length === 0) {
        return message.reply('No commands found.');
      }

      const commandsPerPage = 5;
      const pages = Math.ceil(commands.length / commandsPerPage);
      let currentPage = 0;

      // Function to create the embed for the current page
      const createEmbed = (page) => {
        const start = page * commandsPerPage;
        const end = start + commandsPerPage;
        const pageCommands = commands.slice(start, end);

        const embed = new EmbedBuilder()
          .setTitle('Available Commands')
          .setColor('#00FFFF')
          .setDescription(
            pageCommands.map((cmd) => `**!${cmd.name}**: ${cmd.description}`).join('\n')
          )
          .setFooter({ text: `Page ${page + 1} of ${pages}` });

        return embed;
      };

      // Create buttons for pagination
      const createButtons = (page) => {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0), // Disable 'Previous' on the first page

            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === pages - 1) // Disable 'Next' on the last page
          );

        return row;
      };

      // Send the first page with buttons
      const embed = createEmbed(currentPage);
      const buttons = createButtons(currentPage);
      const sentMessage = await message.channel.send({ embeds: [embed], components: [buttons] });

      // Button interaction handler
      const filter = (interaction) => interaction.user.id === message.author.id;
      const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 minute timeout

      collector.on('collect', async (interaction) => {
        if (interaction.customId === 'previous') {
          currentPage = currentPage > 0 ? currentPage - 1 : currentPage;
        } else if (interaction.customId === 'next') {
          currentPage = currentPage < pages - 1 ? currentPage + 1 : currentPage;
        }

        // Update the embed and buttons
        const updatedEmbed = createEmbed(currentPage);
        const updatedButtons = createButtons(currentPage);
        await interaction.update({ embeds: [updatedEmbed], components: [updatedButtons] });
      });

      collector.on('end', () => {
        // Disable the buttons after the collector ends
        sentMessage.edit({ components: [] });
      });
    } catch (error) {
      console.error('Error loading commands:', error);
      message.reply('An error occurred while loading commands.');
    }
  },
};
