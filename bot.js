const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const { token } = require('./config');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('./database');
const Welcome = require('./models/welcome.js');
const afk = require('./commands/util/afk.js');



// Prefix configuration (can be easily changed here)
const prefix = '!';

// Initialize the Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Map to store commands
const commands = new Map();

/**
 * Recursively load all commands from the commands directory, including subfolders.
 * @param {string} dirPath - The path to the commands directory.
 */
const loadCommands = (dirPath) => {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      // If the current file is a folder, recursively load commands
      loadCommands(filePath);
    } else if (file.endsWith('.js')) {
      // If the file is a JavaScript file, require it and add to the commands map
      const command = require(filePath);
      if (command.name && command.execute) {
        if (!commands.has(command.name)) {
          commands.set(command.name, command); // Add to the commands map
        } else {
          console.warn(`Duplicate command detected: ${command.name}. Skipping.`);
        }
      } else {
        console.warn(`Skipping invalid command file: ${filePath}`);
      }
    }
  }
};

// Load all commands from the commands directory
loadCommands(path.join(__dirname, 'commands'));

// Connect to the database before starting the bot
connectDB();

// Bot ready event
client.once('ready', () => {
  console.log('Bot is logged in and ready!');
});

// Handle messages and respond to commands with the prefix
client.on('messageCreate', async (message) => {
  if (!message.author.bot) {
    await afk.checkMentions(message);
}
  if (message.author.bot) return; // Ignore bot messages

  // Check if the message starts with the prefix
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Check if the command exists
  if (commands.has(commandName)) {
    try {
      // Execute the corresponding command
      await commands.get(commandName).execute(message, args);
    } catch (error) {
      console.error(`Error in command ${commandName}:`, error);
      await message.reply('There was an error trying to execute that command!');
    }
  }
});

client.on('guildMemberAdd', async (member) => {
  try {
    // Fetch welcome data from the database
    const welcomeData = await Welcome.findOne({ guildId: member.guild.id });
    if (!welcomeData || !welcomeData.dmMessage) return;

    // Send DM Welcome Message (Embed)
    const dmEmbed = new EmbedBuilder()
      .setTitle('Welcome to the Server! 🎉')
      .setColor('#00FFFF')
      .setDescription(welcomeData.dmMessage.replace('{user}', member.user.username));

    await member.send({ embeds: [dmEmbed] })
      .catch((err) => console.error('Unable to send DM embed:', err));

    // Send DM Links Message (Plain Text)
    if (welcomeData.dmLinks) {
      await member.send(welcomeData.dmLinks)
        .catch((err) => console.error('Unable to send links:', err));
    }

  } catch (error) {
    console.error('Error handling guildMemberAdd:', error);
  }
});

// Log the bot in
client.login(process.env.TOKEN );
