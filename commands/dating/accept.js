// const { EmbedBuilder,PermissionsBitField,ChannelType } = require('discord.js');
// const Request = require('../../models/request'); // Request model
// const User = require('../../models/user'); // User model

// module.exports = {
//   name: 'accept',
//   description: 'Accept a dating request.',
//   async execute(message) {
//     try {
//       // Fetch all pending requests for the user
//       const pendingRequests = await Request.find({ requested: message.author.id, status: 'pending' });

//       if (pendingRequests.length === 0) {
//         return message.reply("You don't have any pending requests.");
//       }

//       // Create a list of requests with numbers for selection
//       const requestListEmbed = new EmbedBuilder()
//         .setTitle('Pending Dating Requests')
//         .setColor('#FF69B4')
//         .setDescription('Please select a request by typing the corresponding number.')
//         .setTimestamp();

//       pendingRequests.forEach((request, index) => {
//         requestListEmbed.addFields(
//           { name: `#${index + 1}:`, value: `<@${request.requester}>`, inline: true }
//         );
//       });

//       // Send the list of requests
//       await message.channel.send({ embeds: [requestListEmbed] });

//       // Wait for the user to respond with the number
//       const filter = (response) => {
//         return response.author.id === message.author.id && !isNaN(response.content) && response.content > 0 && response.content <= pendingRequests.length;
//       };

//       const collected = await message.channel.awaitMessages({
//         filter,
//         max: 1,
//         time: 30000, // wait for 30 seconds
//         errors: ['time'],
//       });

//       const selectedNumber = parseInt(collected.first().content);
//       const selectedRequest = pendingRequests[selectedNumber - 1];

//       // Fetch the requester user profile
//       const requesterProfile = await User.findOne({ userId: selectedRequest.requester });

//       if (!requesterProfile) {
//         return message.reply("The user who sent the request could not be found.");
//       }

//       // Update both user's profile with new partner information
//       await User.updateOne(
//         { userId: selectedRequest.requester },
//         { partner: selectedRequest.requested, status: 'taken' }
//       );
//       await User.updateOne(
//         { userId: selectedRequest.requested },
//         { partner: selectedRequest.requester, status: 'taken' }
//       );

//       // Update the request status to 'accepted'
//       selectedRequest.status = 'accepted';
//       await selectedRequest.save();

//       // Send success message to the channel
//       const successEmbed = new EmbedBuilder()
//         .setTitle('Match Accepted! 💑')
//         .setColor('#FF69B4')
//         .setDescription(`You and <@${selectedRequest.requester}> are now a couple!`)
//         .setTimestamp();

//       await message.channel.send({ embeds: [successEmbed] });

//       // Send DM to both users about the successful match
//       const dmEmbed = new EmbedBuilder()
//         .setTitle('💘 You\'ve Been Picked!')
//         .setColor('#FF69B4')
//         .setDescription(`${message.author.username} has accepted your request! You are now a couple.`)
//         .addFields(
//           { name: '🎂 Age', value: requesterProfile.age ? requesterProfile.age.toString() : 'N/A', inline: true },
//           { name: '⭐ Sex', value: requesterProfile.sex || 'N/A', inline: true },
//           { name: '💫 Status', value: requesterProfile.status || 'N/A', inline: true },
//           { name: '🎯 Hobbies', value: requesterProfile.hobbies || 'N/A', inline: false },
//         )
//         .setTimestamp()
//         .setFooter({ text: 'Dating System | You are now a couple!' });

//       await message.guild.members.fetch(selectedRequest.requester).then(requesterUser => {
//         requesterUser.send({ embeds: [dmEmbed] });
//       });

//       const userDMEmbed = new EmbedBuilder()
//         .setTitle('💘 You\'ve Accepted!')
//         .setColor('#FF69B4')
//         .setDescription(`You and <@${selectedRequest.requester}> are now a couple!`)
//         .setTimestamp()
//         .setFooter({ text: 'Dating System | You are now a couple!' });

//       await message.author.send({ embeds: [userDMEmbed] });

//       // Now create the private channel for the two users
//       const channelName = `date-${message.author.username}-${selectedRequest.requester}`;
//       const category = message.guild.channels.cache.find(c => c.name === 'Dates' && c.type === 'GUILD_CATEGORY'); // Assuming 'Dates' is the category where channels are created

//       const newChannel = await message.guild.channels.create({
//         name: channelName,
//         type: ChannelType.GuildText,
//         parent: category, // Category where the channel will be created
//         permissionOverwrites: [
//           {
//             id: message.guild.id,
//             deny: [PermissionsBitField.Flags.ViewChannel], // Correct usage of permission flag
//           },
//           {
//             id: message.author.id,
//             allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Allow user 1
//           },
//           {
//             id: selectedRequest.requester,
//             allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Allow user 2
//           },
//         ],
//       });

//       // Send a welcome message in the new channel
//       const welcomeMessage = new EmbedBuilder()
//         .setTitle('💘 Welcome to Your Private Chat!')
//         .setColor('#FF69B4')
//         .setDescription(`Hey <@${message.author.id}> and <@${selectedRequest.requester}>! This is your private chat where you can talk freely. Enjoy your time together!`)
//         .setTimestamp();

//       await newChannel.send({ embeds: [welcomeMessage] });

//     } catch (error) {
//       console.error(error);
//       await message.reply("An error occurred while processing your request.");
//     }
//   },
// };
