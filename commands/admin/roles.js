const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'role',
  description: 'Create a new role in the server (Admin only)',

  async execute(message) {
    // Avoid bot messages
    if (message.author.bot) return;

    // Define the permissions required for the user
    const requiredPermissions = new PermissionsBitField([
      PermissionsBitField.Flags.ManageRoles, // User needs the 'Manage Roles' permission
    ]);

    // Check if the user has the necessary permissions
    if (!message.member.permissions.has(requiredPermissions)) {
      return message.reply('You do not have permission to create roles. You need the "Manage Roles" permission.');
    }

    // Split the message content to get the role name
    const args = message.content.split(' ');

    // Check if a role name is provided
    if (args.length < 2) {
      return message.reply('Please provide the name of the role you want to create.');
    }

    const roleName = args.slice(1).join(' '); // Get role name from args

    try {
      // Check if the bot has permission to manage roles
      const botPermissions = new PermissionsBitField([
        PermissionsBitField.Flags.ManageRoles, // Bot needs the 'Manage Roles' permission
      ]);

      if (!message.guild.me.permissions.has(botPermissions)) {
        return message.reply('I do not have permission to manage roles.');
      }

      // Create the new role
      const role = await message.guild.roles.create({
        name: roleName,
        color: 'BLUE', // Customize the role color if needed
        reason: `Role created by ${message.author.tag} via !role command`,
      });

      message.reply(`Role "${roleName}" has been created successfully!`);

    } catch (error) {
      console.error(error);
      message.reply('There was an error creating the role. Please try again later.');
    }
  },
};
