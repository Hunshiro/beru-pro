const { AttachmentBuilder } = require('discord.js');
const { fetchRiddle } = require('../riddle/riddle-api');
const { getUserData, saveUserData, updateUserStats } = require('../riddle/riddle-data');
const { generateScoreCanvas } = require('../riddle/riddle-canvas');

module.exports = {
  name: 'riddle',
  description: 'Play an interactive riddle-solving game',
  async execute(message, args) {
    const userId = message.author.id;

    // Subcommands
    if (args.length > 0) {
      const subcommand = args[0].toLowerCase();

      if (subcommand === 'score') {
        const userData = await getUserData(userId);
        const buffer = generateScoreCanvas(userData, message.member);
        const attachment = new AttachmentBuilder(buffer, { name: 'score.png' });
        return message.channel.send({ content: `Your riddle stats, <@${userId}>!`, files: [attachment] });
      }

      if (subcommand === 'reset') {
        await saveUserData(userId, { riddlesSolved: 0, hintsUsed: 0, attempts: 0, achievements: [], currentRiddle: null });
        return message.reply('Your riddle progress has been reset!');
      }

      if (subcommand === 'hint') {
        const userData = await getUserData(userId);
        if (!userData.currentRiddle) return message.reply('No active riddle! Use `!riddle` to start.');
        if (userData.currentRiddle.hintsGiven >= 2) return message.reply('No more hints available!');

        userData.hintsUsed++;
        userData.currentRiddle.hintsGiven++;

        if (userData.currentRiddle.hintsGiven === 1) {
          // Hint 1: Show answer length
          const length = userData.currentRiddle.answer.length;
          userData.currentRiddle.revealed = '_'.repeat(length);
          await saveUserData(userId, userData);
          return message.reply(`Hint: The answer is ${length} letters long: \`${userData.currentRiddle.revealed}\``);
        } else {
          // Hint 2: Reveal some letters
          const answer = userData.currentRiddle.answer;
          let revealed = userData.currentRiddle.revealed.split('');
          const indices = Array.from({ length: answer.length }, (_, i) => i);
          const revealCount = Math.ceil(answer.length / 3);
          for (let i = 0; i < revealCount; i++) {
            const randomIndex = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
            revealed[randomIndex] = answer[randomIndex];
          }
          userData.currentRiddle.revealed = revealed.join('');
          await saveUserData(userId, userData);
          return message.reply(`Hint: \`${userData.currentRiddle.revealed}\` (underscores are hidden letters)`);
        }
      }

      return message.reply('Use `!riddle`, `!riddle score`, `!riddle reset`, or `!riddle hint`.');
    }

    // New riddle
    let userData = await getUserData(userId);
    if (!userData.currentRiddle) {
      const riddle = await fetchRiddle();
      if (!riddle) return message.reply('Failed to fetch a riddle. Try again later!');

      userData.currentRiddle = {
        question: riddle.question,
        answer: riddle.answer.toLowerCase(),
        revealed: '',
        hintsGiven: 0
      };
      await saveUserData(userId, userData);
      return message.reply(`**${userData.currentRiddle.question}**\nUse \`!riddle hint\` for help!`);
    }

    // Guess handling
    const guess = args.join(' ').toLowerCase().trim();
    if (!guess) return;

    userData.attempts++;
    if (guess === userData.currentRiddle.answer) {
      userData.riddlesSolved++;
      userData.currentRiddle = null;
      updateUserStats(userData);
      await saveUserData(userId, userData);
      return message.reply(`Correct! 🎉 You've solved ${userData.riddlesSolved} riddles. Use !riddle for a new one!`);
    } else {
      await saveUserData(userId, userData);
      return message.reply('Wrong guess! Try again or use `!riddle hint`.');
    }
  }
};