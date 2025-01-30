// const { EmbedBuilder } = require('discord.js');
// const User = require('../../models/user');

// module.exports = {
//   name: 'randomdate',
//   description: 'Show random dating picks based on preferences',
//   async execute(message) {
//     const user = await User.findOne({ userId: message.author.id });
//     if (!user) {
//       return message.channel.send("You need to create a profile first! Use /start.");
//     }

//     const potentialMatches = await User.find({ sexualPreference: user.sexualPreference }).limit(5);
//     const embed = new EmbedBuilder()
//       .setTitle("Top 5 Dating Picks for You")
//       .setColor('#FFB6C1');

//     potentialMatches.forEach((match, index) => {
//       embed.addFields({
//         name: `#${index + 1}`,
//         value: `${match.age} | ${match.sex} | ${match.horoscope}`,
//         inline: true,
//       });
//     });

//     message.channel.send({ embeds: [embed] });
//   },
// };
