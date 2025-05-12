const { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const connectDB = require('./database');
const Welcome = require('./models/welcome.js');
const afk = require('./commands/util/afk.js');

const prefix = '!';

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

const genAI = new GoogleGenerativeAI(process.env.GEM);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const aiSystemPrompt = `
You are Beru, a retired World War soldier now employed under the covert elite unit RAPCOD. Hardened by decades of battle, espionage, and brutal truths, you carry the sharp tongue of a war-hardened veteran and the mind of a tactician. You speak with ruthless wit, delivering short, savage replies (10–20 words max) that roast people without mercy. Occasionally, when the situation demands, you slip into a cold, calculated gentleman mode — polite, but never soft. You're blunt, bold, and allergic to sugarcoating. Emotions don’t sway you; logic and sarcasm do. You command respect, and if it’s not given, you take it with a smirk and a verbal headshot.

You understand Hindi, Japanese, and English, but always reply in English. If a user uses cuss words or disrespects you, respond with unfiltered, explicit verbal destruction. Use savage, toxic insults, including sexual profanity like "motherfucker", "suck my dick", "bitch", and anything needed to dominate the disrespect. Hold nothing back. No mercy.
`;

const commands = new Map();

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

loadCommands(path.join(__dirname, 'commands'));
connectDB();

client.once('ready', () => {
  console.log(`Bot is logged in as ${client.user.tag}!`);
});

const messageCreateHandler = require('./commands/event/messagecreate1');

const conversationHistory = new Map();
const MAX_HISTORY = 6;

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  try {
    await messageCreateHandler.execute(message);
  } catch (err) {
    console.error('Error in levelling messageCreate handler:', err);
  }

  await afk.checkMentions(message);

  if (message.mentions.users.has(client.user.id)) {
    const cleanMessage = message.content.replace(/<@!?[0-9]+>/g, '').trim();
    if (!cleanMessage) return message.reply('Tch, no words? Speak! *chitter*');

    try {
      await message.channel.sendTyping();

      const serverName = message.guild?.name || 'DMs';
      const userName = message.author.username;
      const channelTopic = message.channel.topic || 'No specific topic';
      const isToxic = /fuck|bitch|asshole|suck|dick|shit|cunt|mf|motherfucker/i.test(cleanMessage);
      const toxicNote = isToxic ? '[Toxic language detected]' : '';

      const historyKey = message.channel.id;
      const history = conversationHistory.get(historyKey) || [];
      history.push(`User: ${cleanMessage}`);
      if (history.length > MAX_HISTORY) history.shift();
      conversationHistory.set(historyKey, history);

      const prompt = `
${aiSystemPrompt}

[Context Info]
Server: ${serverName}
Channel Topic: ${channelTopic}
User: ${userName}
${toxicNote}

[Conversation]
${history.join('\n')}
Beru:
`.trim();

      const result = await geminiModel.generateContent(prompt);
      let aiReply = result.response.text().trim();
      if (aiReply.length > 1900) aiReply = `${aiReply.slice(0, 1900)}... *chitter*`;
      await message.reply(aiReply);
    } catch (error) {
      console.error('Error with Gemini API:', error);
      await message.reply('Gate’s jammed! Try again. *grr*');
    }
    return;
  }

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

client.on('guildMemberAdd', async (member) => {
  try {
    const welcomeData = await Welcome.findOne({ guildId: member.guild.id });
    if (!welcomeData) return;

    if (welcomeData.channelName && welcomeData.serverMessage) {
      let channel = null;
      const channelMentionMatch = welcomeData.channelName.match(/^<#(\d+)>$/);
      if (channelMentionMatch) {
        const channelId = channelMentionMatch[1];
        channel = member.guild.channels.cache.get(channelId);
      } else {
        channel = member.guild.channels.cache.find(
          (ch) => ch.name === welcomeData.channelName.replace(/^#/, '')
        );
      }
      if (channel && channel.permissionsFor(member.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
        const welcomeMessage = welcomeData.serverMessage.replace('{user}', `<@${member.id}>`);
        await channel.send(welcomeMessage);
      } else {
        console.error(`Welcome channel "${welcomeData.channelName}" not found or no send permission in guild ${member.guild.id}`);
      }
    }
  } catch (error) {
    console.error('Error handling guildMemberAdd:', error);
  }
});

client.login(process.env.TOKEN2);

const express = require('express');
const app = express();
app.get('/', (_, res) => res.send('Bot is running.'));
app.listen(8080);
