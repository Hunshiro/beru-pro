const { EmbedBuilder } = require('discord.js');
const User = require('../../models/user');

module.exports = {
  name: 'start',
  description: 'Start creating a dating profile',
  async execute(message) {
    try {
      // Check if the user already has a profile
      const existingUser = await User.findOne({ userId: message.author.id });
      if (existingUser) {
        return message.author.send("You already have a profile created. You cannot use this command again.");
      }

      // Delete the original command message to keep things clean
      await message.delete().catch(console.error);

      // Send initial message to the channel to let user know to check DMs
      const initMsg = await message.channel.send(`${message.author}, I've sent you a DM to create your profile privately! 📨`);
      setTimeout(() => initMsg.delete().catch(console.error), 10000); // Delete after 10 seconds

      const filter = response => response.author.id === message.author.id;
      let userInfo = {};

      // Questions array to make the process more manageable
      const questions = [
        {
          title: "Let's get started!",
          description: "Welcome to the dating profile creation! First things first... What's your age?",
          field: 'age'
        },
        {
          title: "Great! Age confirmed!",
          description: "Now, let's talk about you... What's your sex? (Male/Female/Other)",
          field: 'sex'
        },
        {
          title: "Nice choice!",
          description: "Let's move on. What's your horoscope? (e.g., Aries, Taurus, Gemini, etc.)",
          field: 'horoscope'
        },
        {
          title: "Horoscope added!",
          description: "What's your sexual preference? (e.g., Heterosexual, Homosexual, Bisexual, etc.)",
          field: 'sexualPreference'
        },
        {
          title: "Got it!",
          description: "What's your current relationship status? (Single, In a relationship, It's complicated)",
          field: 'status'
        },
        {
          title: "Status noted!",
          description: "What do you like? (e.g., Movies, Cooking, Travel, etc.)",
          field: 'likes'
        },
        {
          title: "Likes are saved!",
          description: "Now, what do you dislike? (e.g., Spicy food, Loud music, etc.)",
          field: 'dislikes'
        },
        {
          title: "Dislikes noted!",
          description: "What are your hobbies? (e.g., Reading, Sports, Painting, etc.)",
          field: 'hobbies'
        },
        {
          title: "Hobbies saved!",
          description: "Almost there! Please upload your profile picture.",
          field: 'image'
        }
      ];

      // Function to send questions via DM
      const sendQuestion = async (question) => {
        const embed = new EmbedBuilder()
          .setTitle(question.title)
          .setDescription(question.description)
          .setColor('#FFB6C1')
          .setFooter({ text: 'You have 60 seconds to answer each question!' })
          .setTimestamp();

        return message.author.send({ embeds: [embed] });
      };

      // Process questions sequentially
      for (const question of questions) {
        await sendQuestion(question);

        try {
          const collected = await message.author.dmChannel.awaitMessages({
            filter,
            max: 1,
            time: 60000,
            errors: ['time']
          });

          const response = collected.first();
          
          if (question.field === 'image') {
            if (response.attachments.size > 0) {
              userInfo[question.field] = response.attachments.first().url;
            } else {
              throw new Error('No image provided');
            }
          } else {
            userInfo[question.field] = response.content;
          }
        } catch (error) {
          message.author.send("You took too long to answer or there was an error. Please try again with the start command.");
          return;
        }
      }

      // Save to database
      await new User({ userId: message.author.id, ...userInfo }).save();

      // Create final profile embed
      const profileEmbed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Profile`)
        .setDescription(`${userInfo.age} | ${userInfo.sex} | ${userInfo.horoscope}`)
        .addFields(
          { name: 'Status', value: userInfo.status, inline: true },
          { name: 'Likes', value: userInfo.likes, inline: true },
          { name: 'Dislikes', value: userInfo.dislikes, inline: true },
          { name: 'Hobbies', value: userInfo.hobbies, inline: true }
        )
        .setImage(userInfo.image)
        .setColor('#FFB6C1')
        .setFooter({ text: 'Your profile is ready for you to use!' });

      // Send completion messages
      await message.author.send("Your profile has been created successfully! 🎉");
      const finalMsg = await message.channel.send({ 
        content: `${message.author}, your dating profile has been created! 🎉`,
        embeds: [profileEmbed] 
      });

    } catch (error) {
      console.error('Error in start command:', error);
      message.author.send("There was an error creating your profile. Please try again later.");
    }
  },
};