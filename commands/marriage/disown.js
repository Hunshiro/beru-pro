const { Children } = require('../../models/children');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'disown',
    description: 'Disown a child from your adoption list.',
    async execute(message, args) {
        try {
            const adopter = message.author;

            // Fetch adopted children of the user
            const adoptedChildren = await Children.find({ parent: adopter.id });

            if (!adoptedChildren || adoptedChildren.length === 0) {
                return message.reply('You do not have any adopted children to disown.');
            }

            // Display the list of children to choose from
            let childrenList = adoptedChildren.map((child, index) => {
                return `${index + 1}. ${child.child_name} (ID: ${child.child_id})`;
            }).join('\n');

            const childListEmbed = new EmbedBuilder()
                .setTitle('Your Adopted Children')
                .setDescription(childrenList)
                .setColor('#FFD700')
                .setFooter({ text: 'Choose a child by number to disown.' });

            const childListMessage = await message.reply({ embeds: [childListEmbed] });

            // Wait for user input to select a child to disown
            const filter = response => response.author.id === adopter.id && !isNaN(response.content) && response.content > 0 && response.content <= adoptedChildren.length;
            const collector = message.channel.createMessageCollector({ filter, time: 60000 });

            collector.on('collect', async response => {
                const childIndex = parseInt(response.content) - 1; // Get the selected child's index
                const childToDisown = adoptedChildren[childIndex];

                // Remove the child from the database
                await Children.deleteOne({ _id: childToDisown._id });

                const disownEmbed = new EmbedBuilder()
                    .setTitle('Child Disowned Successfully! 😢')
                    .setDescription(`${adopter} has disowned ${childToDisown.child_name}.`)
                    .setColor('#FF4500')
                    .setTimestamp();

                await response.reply({ embeds: [disownEmbed] });

                // Remove the child list message
                childListMessage.delete();

                collector.stop(); // End the collector after a valid response
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('Disown Request Timeout ⏰')
                        .setDescription('You took too long to respond. The disown request has expired.')
                        .setColor('#808080')
                        .setTimestamp();

                    childListMessage.edit({ embeds: [timeoutEmbed] });
                }
            });
        } catch (error) {
            console.error('Error in disown command:', error);
            message.reply('There was an error processing the disown request! Please try again later.');
        }
    },
};
