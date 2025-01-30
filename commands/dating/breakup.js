// const { EmbedBuilder } = require('discord.js');
// const User = require('../../models/user');

// module.exports = {
//   name: 'breakup',
//   description: 'End your relationship with your partner',
//   async execute(message) {
//     try {
//       // Fetch the user's profile
//       const userProfile = await User.findOne({ userId: message.author.id });

//       if (!userProfile) {
//         return message.reply("You don't have a profile yet. Please create one with !start.");
//       }

//       if (!userProfile.partner) {
//         return message.reply("You don't have a partner to break up with.");
//       }

//       const partnerId = userProfile.partner;

//       // Check if partnerId exists
//       if (!partnerId) {
//         return message.reply("Your partner's profile seems to be missing or not linked.");
//       }

//       // Fetch the partner's profile
//       const partnerProfile = await User.findOne({ userId: partnerId });

//       if (!partnerProfile) {
//         return message.reply("We couldn't find your partner's profile in the database. Please contact support.");
//       }

//       // Send DM to the partner about the breakup request
//       const partnerUser = await message.guild.members.fetch(partnerId);

//       const breakupEmbed = new EmbedBuilder()
//         .setTitle('💔 Breakup Request')
//         .setColor('#FF6347')
//         .setDescription(`${message.author.username} wants to break up with you.`)
//         .addFields(
//           { name: 'Reason', value: 'Please type "Accept" to confirm the breakup.', inline: false }
//         )
//         .setTimestamp()
//         .setFooter({ text: 'Dating System | You have 2 minutes to respond!' });

//       await partnerUser.send({ embeds: [breakupEmbed] });

//       // Announce in the channel
//       await message.channel.send(
//         `<@${partnerId}>, you have received a breakup request from ${message.author.username}. Please check your DMs.`
//       );

//       // Wait for partner to accept the breakup
//       const acceptFilter = m =>
//         m.author.id === partnerId && m.content.toLowerCase() === 'accept';

//       try {
//         await message.channel.awaitMessages({
//           filter: acceptFilter,
//           max: 1,
//           time: 120000, // 2 minutes
//           errors: ['time'],
//         });

//         // Update both users' profiles to "single" and remove partner
//         await User.updateOne({ userId: message.author.id }, { partner: null, status: 'single' });
//         await User.updateOne({ userId: partnerId }, { partner: null, status: 'single' });

//         // Remove the "Couple" role from both users
//         const coupleRole = message.guild.roles.cache.find(role => role.name === 'Couple');
//         if (coupleRole) {
//           await message.guild.members.cache.get(message.author.id).roles.remove(coupleRole);
//           await message.guild.members.cache.get(partnerId).roles.remove(coupleRole);
//         }

//         // Notify both users about the successful breakup
//         const successEmbed = new EmbedBuilder()
//           .setColor('#FF6347')
//           .setTitle('💔 You have broken up!')
//           .setDescription(`You and ${partnerUser.user.username} are no longer a couple.`)
//           .setTimestamp()
//           .setFooter({ text: 'We hope you both find happiness!' });

//         await message.author.send({ embeds: [successEmbed] });
//         await partnerUser.send({ embeds: [successEmbed] });

//         // Announce in the channel
//         await message.channel.send(
//           `🎉 <@${message.author.id}> and <@${partnerId}> have officially broken up. They are now single.`
//         );
//       } catch (error) {
//         // Time expired without acceptance
//         await message.channel.send(
//           `${partnerUser.user.username} didn't accept in time. The breakup request has expired.`
//         );
//       }
//     } catch (error) {
//       console.error(error);
//       await message.reply("An error occurred while processing your request.");
//     }
//   },
// };
