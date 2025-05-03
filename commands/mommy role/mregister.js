const { getMommyUserData } = require('./data');

module.exports = {
  name: 'mregister',
  description: 'Register for the Mommy Role League (Female role required)',
  async execute(message) {
    try {
      const userId = message.author.id;

      // Check if user has Female role
      const femaleRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'female');
      if (!message.member.roles.cache.has(femaleRole?.id)) {
        return message.reply('Only members with the Female role can join the Mommy Role League!');
      }

      // Check if already registered
      const userData = await getMommyUserData(userId);
      if (userData.gloryPoints > 0 || userData.dailyPoints.pointsReceived > 0) {
        return message.reply('You’re already registered in the Mommy Role League! Check your profile with `!mprofile`.');
      }

      // Confirm registration (record is already created by getMommyUserData)
      return message.reply('Successfully registered for the Mommy Role League! 🌸 Start earning glory points with `!addglory` from RC Mommy members.');
    } catch (error) {
      console.error('Registration error:', error);
      return message.reply('Error registering for the Mommy Role League!');
    }
  }
};