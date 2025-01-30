// const { EmbedBuilder } = require('discord.js');
// const User = require('../../models/user');

// module.exports = {
//   name: 'status',
//   description: 'Check your status or another user\'s status (who is their partner)',
//   async execute(message, args) {
//     try {
//       const targetUser = args.length > 0 ? message.mentions.users.first() : message.author;
//       const user = await User.findOne({ userId: targetUser.id });

//       if (!user) {
//         const errorEmbed = new EmbedBuilder()
//           .setColor('#FF6B6B')
//           .setTitle('❌ Profile Not Found')
//           .setDescription(`${targetUser.username} doesn't have a profile yet. Use /start to create one!`)
//           .setFooter({ text: 'Dating System' });
//         return message.reply({ embeds: [errorEmbed] });
//       }

//       const partner = user.partner 
//   ? await message.guild.members.fetch(user.partner).then(member => member.user.username).catch(() => 'Partner not found')
//   : 'No partner yet!';

//       const embed = new EmbedBuilder()
//         .setColor('#FF1493')
//         .setTitle(`${targetUser.username}'s Status`)
//         .setDescription(`
//              **status**: ${user.status}
//           **Partner**: ${partner}
         
         
//         `)
//         .setFooter({ text: 'Dating System | Use /update to modify your profile!' });

//       await message.reply({ embeds: [embed] });
//     } catch (error) {
//       console.error('Error fetching status:', error);
//       const errorEmbed = new EmbedBuilder()
//         .setColor('#FF6B6B')
//         .setTitle('❌ Error')
//         .setDescription('There was an error fetching the status.')
//         .setFooter({ text: 'Please try again later!' });

//       await message.reply({ embeds: [errorEmbed] });
//     }
//   },
// };
