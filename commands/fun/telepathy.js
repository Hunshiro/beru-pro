const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'telepathy',
  description: 'Test your telepathy skills with your partner!',
  async execute(message, args, client) {
    // Check if the user mentioned someone
    const partner = message.mentions.users.first();
    if (!partner) {
      return message.reply('You need to mention your partner to play! Example: `!telepathy @partner`');
    }

    if (partner.id === message.author.id) {
      return message.reply("You can't play telepathy with yourself! Mention someone else.");
    }

    // Notify the game is starting
    const embedStart = new EmbedBuilder()
      .setTitle('🧠 Telepathy Game 🧠')
      .setDescription(
        `A telepathy test between **${message.author.username}** and **${partner.username}** is starting!\n\n` +
        `Both of you will receive the same questions in your DMs. Answer them carefully!\n` +
        `Let's see how well you sync.`
      )
      .setColor('#00FFCC');

    await message.channel.send({ embeds: [embedStart] });

    // Questions to ask
    const questions = [
      "What's your favorite color?",
      "What's your dream vacation destination?",
      "What's your favorite food?",
      "What's your favorite movie genre?",
      "If you had a superpower, what would it be?"
    ];

    // Function to send DM and collect answers
    async function collectAnswers(user) {
      try {
        const dmChannel = await user.createDM();
        const answers = [];

        for (const question of questions) {
          await dmChannel.send(question);
          const collected = await dmChannel.awaitMessages({
            max: 1,
            time: 60000,
            errors: ['time']
          });
          answers.push(collected.first().content);
        }

        return answers;
      } catch (error) {
        message.channel.send(`Couldn't collect answers from ${user.username}. Ensure their DMs are open!`);
        return null;
      }
    }

    // Collect answers from both players
    const authorAnswers = await collectAnswers(message.author);
    const partnerAnswers = await collectAnswers(partner);

    if (!authorAnswers || !partnerAnswers) {
      return message.channel.send('The game was interrupted due to unanswered questions.');
    }

    // Compare answers and calculate match
    let matchCount = 0;
    for (let i = 0; i < questions.length; i++) {
      if (authorAnswers[i].toLowerCase() === partnerAnswers[i].toLowerCase()) {
        matchCount++;
      }
    }

    const matchPercentage = Math.floor((matchCount / questions.length) * 100);

    // Display results
    const embedResults = new EmbedBuilder()
      .setTitle('✨ Telepathy Results ✨')
      .setDescription(
        `**${message.author.username}** and **${partner.username}** have completed the telepathy test!\n\n` +
        `You matched on **${matchCount}/${questions.length}** questions.\n` +
        `That's a telepathy score of **${matchPercentage}%**!`
      )
      .setColor('#FF69B4')
      .setFooter({ text: 'Thanks for playing!' });

    message.channel.send({ embeds: [embedResults] });
  },
};
