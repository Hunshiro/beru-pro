// const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
// const User = require('../../models/user');
// const Request = require('../../models/request');

// module.exports = {
//   name: 'date',
//   description: 'Find and send a date request to another user',
//   async execute(message) {
//     try {
//       const potentialMatches = await User.find({ userId: { $ne: message.author.id } });
//       const topMatches = potentialMatches.slice(0, 5);

//       if (topMatches.length === 0) {
//         return message.reply('No matches found at the moment. Try again later!');
//       }

//       const enrichedMatches = await Promise.all(
//         topMatches.map(async match => {
//           try {
//             const user = await message.client.users.fetch(match.userId);
//             return {
//               ...match._doc,
//               username: user.username,
//             };
//           } catch {
//             return {
//               ...match._doc,
//               username: 'Unknown',
//             };
//           }
//         })
//       );

//       const embed = new EmbedBuilder()
//         .setTitle('Top 5 Matches')
//         .setDescription(
//           enrichedMatches
//             .map((match, index) => `${index + 1}. **${match.username}** (Age: ${match.age || 'N/A'})`)
//             .join('\n')
//         )
//         .setColor('#FFB6C1')
//         .setFooter({ text: 'Reply with the number of your choice to send a request.' });

//       await message.channel.send({ embeds: [embed] });

//       const filter = response => response.author.id === message.author.id;
//       const collector = message.channel.createMessageCollector({ filter, time: 30000 });

//       collector.on('collect', async response => {
//         const choice = parseInt(response.content, 10);

//         if (isNaN(choice) || choice < 1 || choice > enrichedMatches.length) {
//           response.reply('Invalid choice! Please reply with a valid number from the list.');
//           return;
//         }

//         const selectedMatch = enrichedMatches[choice - 1];
//         collector.stop();

//         const targetUser = await message.client.users.fetch(selectedMatch.userId);
//         if (!targetUser) {
//           return message.reply('Could not find the selected user. Please try again.');
//         }

//         const newRequest = new Request({
//           requester: message.author.id,
//           requested: selectedMatch.userId,
//         });

//         await newRequest.save();

//         // Embed for the requested user
//         const requestEmbed = new EmbedBuilder()
//           .setTitle('Request Sent')
//           .setDescription(
//             `You have received a date request from **${message.author.username}**. Click the button below to view their profile.`
//           )
//           .setColor('#FFB6C1');

//         // Button to view the requester's profile
//         const viewProfileButton = new ButtonBuilder()
//           .setCustomId(`view_profile_${message.author.id}`)
//           .setLabel('View Profile')
//           .setStyle(ButtonStyle.Primary);

//         const actionRow = new ActionRowBuilder().addComponents(viewProfileButton);

//         await targetUser.send({
//           embeds: [requestEmbed],
//           components: [actionRow],
//         });

//         message.reply('Your date request has been sent and the user has been notified!');

//         // Interaction listener for the button
//         const interactionCollector = message.client.on('interactionCreate', async interaction => {
//           if (!interaction.isButton()) return;

//           const buttonId = interaction.customId;
//           if (buttonId === `view_profile_${message.author.id}`) {
//             // Fetch requester's profile
//             const requesterProfile = await User.findOne({ userId: message.author.id });

//             if (!requesterProfile) {
//               return interaction.reply({
//                 content: "Couldn't fetch the requester's profile. Please try again later!",
//                 ephemeral: true,
//               });
//             }

//             const profileEmbed = new EmbedBuilder()
//               .setTitle(`${message.author.username}'s Profile`)
//               .setDescription(
//                 `**Age:** ${requesterProfile.age}\n**Sex:** ${requesterProfile.sex}\n**Horoscope:** ${requesterProfile.horoscope}`
//               )
//               .addFields(
//                 { name: 'Status', value: requesterProfile.status, inline: true },
//                 { name: 'Likes', value: requesterProfile.likes, inline: true },
//                 { name: 'Dislikes', value: requesterProfile.dislikes, inline: true },
//                 { name: 'Hobbies', value: requesterProfile.hobbies, inline: true }
//               )
//               .setColor('#FFB6C1');

//             if (requesterProfile.image) {
//               profileEmbed.setThumbnail(requesterProfile.image);
//             }

//             await interaction.reply({
//               embeds: [profileEmbed],
             
//             });
//           }
//         });
//       });

//       collector.on('end', collected => {
//         if (collected.size === 0) {
//           message.reply('You took too long to respond. Please try again later!');
//         }
//       });
//     } catch (error) {
//       console.error(error);
//       message.reply('An error occurred while processing your request. Please try again later.');
//     }
//   },
// };
