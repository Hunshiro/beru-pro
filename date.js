const { EmbedBuilder } = require('discord.js');
const User = require('./models/user');
const Request = require('./models/request'); // Import the request model

module.exports = {
  name: 'date',
  description: 'Find random date suggestions based on your profile',
  async execute(message) {
    try {
      // Fetch the user's profile
      const userProfile = await User.findOne({ userId: message.author.id });

      if (!userProfile) {
        return message.reply("You don't have a profile yet. Please create one with !start.");
      }

      // If the user already has a partner, don't allow them to look for a date
      if (userProfile.partner) {
        return message.reply("You already have a partner. You cannot pick another match.");
      }

      const sexualPreference = userProfile.sexualPreference.toLowerCase();

      // Find potential matches excluding users who are already in a relationship (status "taken")
      const potentialMatches = await User.find({
        sexualPreference: sexualPreference === 'Any' ? { $ne: 'Any' } : sexualPreference,
        userId: { $ne: message.author.id },
        partner: { $eq: null }, // Ensure the match doesn't have a partner already
        status: { $ne: 'taken' } // Exclude users who are already in a couple
      }).limit(5);

      if (potentialMatches.length === 0) {
        return message.reply('Sorry, no matches found based on your preferences.');
      }

      // Create and send embed with matches
      const embed = new EmbedBuilder()
        .setTitle('Top 5 Date Picks')
        .setDescription('Here are the top 5 profiles based on your preferences:')
        .setColor('#FFB6C1');

      potentialMatches.forEach((match, index) => {
        embed.addFields({
          name: `Pick ${index + 1}`,
          value: `**Username**: <@${match.userId}>\n**Age**: ${match.age}\n**Sex**: ${match.sex}\n**Status**: ${match.status}\n**Hobbies**: ${match.hobbies}`,
          inline: true,
        });
      });

      await message.channel.send({ embeds: [embed] });
      await message.channel.send("Please type the number of the profile you want to pick (1-5):");

      // Wait for user's pick
      const filter = m => m.author.id === message.author.id && ['1', '2', '3', '4', '5'].includes(m.content);

      let userPick;
      try {
        const collected = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: 30000,
          errors: ['time']
        });
        userPick = collected.first();
      } catch (error) {
        return message.reply('You did not make a selection in time.');
      }

      const selectedMatch = potentialMatches[parseInt(userPick.content) - 1];

      if (!selectedMatch) {
        return message.reply("Invalid selection.");
      }

      try {
        // Create a request and store it in the database
        const request = new Request({
          requester: message.author.id,
          requested: selectedMatch.userId,
          status: 'pending',
        });

        await request.save();

        // Notify the user their request has been sent
        await message.reply("Your request has been sent! You will be notified once the other user accepts you as a partner.");

        // Send DM to the selected user
        const dmEmbed = new EmbedBuilder()
          .setTitle('💘 You\'ve Been Picked!')
          .setColor('#FF69B4')
          .setDescription(`${message.author.username} has picked you as a potential match in ${message.channel}!`)
          .addFields(
            { name: '🎂 Age', value: userProfile.age.toString(), inline: true },
            { name: '⭐ Sex', value: userProfile.sex, inline: true },
            { name: '💫 Status', value: userProfile.status, inline: true },
            { name: '🎯 Hobbies', value: userProfile.hobbies, inline: false },
            { name: '📍 Next Steps', value: `Head over to ${message.channel} and type "Accept" if you're interested!` }
          )
          .setTimestamp()
          .setFooter({ text: 'Dating System | You have 2 minutes to accept!' });

        const selectedUser = await message.guild.members.fetch(selectedMatch.userId);
        await selectedUser.send({ embeds: [dmEmbed] });

        // Announce in channel
        await message.channel.send(
          `<@${selectedMatch.userId}>, you've been picked by ${message.author.username}! ` +
          `Type "Accept" in this channel within 2 minutes if you want to be a couple!`
        );

      } catch (error) {
        console.error(error);
        await message.channel.send(
          "There was an error contacting the selected user. They might have DMs disabled."
        );
      }

    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while processing your request.");
    }
  },
};
