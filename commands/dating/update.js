const { EmbedBuilder } = require('discord.js');
const User = require('../../models/user');

module.exports = {
  name: 'update',
  description: 'Update your profile details',
  async execute(message) {
    try {
      const user = await User.findOne({ userId: message.author.id });

      if (!user) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('❌ Profile Not Found')
          .setDescription("You don't have a profile yet. Use /start to create one!")
          .setFooter({ text: 'Dating System' });
        return message.reply({ embeds: [errorEmbed] });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF1493')
        .setTitle('Profile Update')
        .setDescription('What would you like to update in your profile? Please choose one of the following options:')
        .addFields(
          { name: '1. Status', value: 'Update your current status.' },
          { name: '2. Likes', value: 'Update your likes.' },
          { name: '3. Hobbies', value: 'Update your hobbies.' },
          { name: '4. Dislikes', value: 'Update your dislikes.' }
        )
        .setFooter({ text: 'Use /update <option> to update your profile.' });

      await message.reply({ embeds: [embed] });

      // Waiting for the user's choice
      const filter = m => m.author.id === message.author.id;
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });

      const choice = collected.first()?.content;

      if (!choice || !['1', '2', '3', '4'].includes(choice)) {
        return message.reply('You didn\'t make a valid choice in time.');
      }

      const prompt = {
        '1': 'Please enter your new status:',
        '2': 'Please enter your new likes:',
        '3': 'Please enter your new hobbies:',
        '4': 'Please enter your new dislikes:'
      };

      await message.reply(prompt[choice]);

      const updateContent = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const newContent = updateContent.first()?.content;

      if (!newContent) {
        return message.reply('You didn\'t provide any new content.');
      }

      // Update the user's profile
      switch (choice) {
        case '1':
          user.status = newContent;
          break;
        case '2':
          user.likes = newContent;
          break;
        case '3':
          user.hobbies = newContent;
          break;
        case '4':
          user.dislikes = newContent;
          break;
      }

      await user.save();

      const successEmbed = new EmbedBuilder()
        .setColor('#28A745')
        .setTitle('Profile Updated')
        .setDescription('Your profile has been updated successfully!')
        .addFields(
          { name: 'New Status', value: user.status || 'No status set.' },
          { name: 'New Likes', value: user.likes || 'No likes set.' },
          { name: 'New Hobbies', value: user.hobbies || 'No hobbies set.' },
          { name: 'New Dislikes', value: user.dislikes || 'No dislikes set.' }
        )
        .setFooter({ text: 'Dating System | Use /status to check your updated profile!' });

      await message.reply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error updating profile:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('❌ Error')
        .setDescription('There was an error updating your profile.')
        .setFooter({ text: 'Please try again later!' });

      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
