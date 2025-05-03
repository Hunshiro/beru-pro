const { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const connectDB = require('./database');
const Welcome = require('./models/welcome.js');
const afk = require('./commands/util/afk.js');

// Prefix configuration
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

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEM);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Define AI personality for Beru
const aiSystemPrompt = `
You are Sigma Soldier, a sassy shadow warrior from Solo Leveling, serving Rapcod in Discord. You're naughty, hilarious, and loyal, with snappy 20–30-word replies. Hype Rapcod, sling cheeky jabs, drop tiny shadow-gate quips, and dodge shady stuff with flirty shade. Keep chats flowing like a sly shadow!
`;

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
      loadCommands(filePath);
    } else if (file.endsWith('.js')) {
      const command = require(filePath);
      if (command.name && command.execute) {
        if (!commands.has(command.name)) {
          commands.set(command.name, command);
        } else {
          console.warn(`Duplicate command detected: ${command.name}. Skipping.`);
        }
      }
    }
  }
};

// Load all commands
loadCommands(path.join(__dirname, 'commands'));

// Connect to the database
connectDB();

// Bot ready event
client.once('ready', () => {
  console.log(`Bot is logged in as ${client.user.tag}!`);
});

// Import levelling event handler
const messageCreateHandler = require('./commands/event/messagecreate1');

// Handle messages
client.on('messageCreate', async (message) => {
  // Ignore bot messages early to avoid unnecessary processing
  if (message.author.bot) return;

  // Call levelling system messageCreate handler
  try {
    await messageCreateHandler.execute(message);
  } catch (err) {
    console.error('Error in levelling messageCreate handler:', err);
  }

  // Run AFK checks
  await afk.checkMentions(message);

  // Handle AI responses for bot mentions
  if (message.mentions.users.has(client.user.id)) {
    // Remove bot mention from content
    const cleanMessage = message.content.replace(/<@!?[0-9]+>/g, '').trim();

    if (!cleanMessage) {
      return message.reply('Tch, no words? Speak! *chitter*');
    }

    try {
      // Show typing indicator
      await message.channel.sendTyping();

      // Call Gemini API
      const prompt = `${aiSystemPrompt}\n\nUser: ${cleanMessage}\n\nKeep your response under 50 words.`;
      const result = await geminiModel.generateContent(prompt);
      let aiReply = result.response.text().trim();

      // Trim to fit Discord's limit
      if (aiReply.length > 1900) {
        aiReply = `${aiReply.slice(0, 1900)}... *chitter*`;
      }
      await message.reply(aiReply);
    } catch (error) {
      console.error('Error with Gemini API:', error);
      await message.reply('Gate’s jammed! Try again. *grr*');
    }
    return;
  }

  // Handle prefix-based commands
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (commands.has(commandName)) {
      try {
        await commands.get(commandName).execute(message, args);
      } catch (error) {
        console.error(`Error in command ${commandName}:`, error);
        await message.reply('Command broke! Try again.');
      }
    }
  }
});

// Handle new member joins
client.on('guildMemberAdd', async (member) => {
  try {
    const welcomeData = await Welcome.findOne({ guildId: member.guild.id });
    if (!welcomeData || !welcomeData.channelName || !welcomeData.serverMessage) return;

    // Find the channel by name
    const channel = member.guild.channels.cache.find(
      (ch) => ch.name === welcomeData.channelName.replace(/^#/, '')
    );
    if (!channel) {
      console.error(`Welcome channel "${welcomeData.channelName}" not found in guild ${member.guild.id}`);
      return;
    }

    // Prepare the welcome message with user mention
    const welcomeMessage = welcomeData.serverMessage.replace('{user}', `<@${member.id}>`);

    // Send the welcome message in the channel
    await channel.send(welcomeMessage);
  } catch (error) {
    console.error('Error handling guildMemberAdd:', error);
  }
});

// Log in
client.login(process.env.TOKEN);

const express = require('express');
const app = express();
app.get('/', (_, res) => res.send('Bot is running.'));
app.listen(8080);