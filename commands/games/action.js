const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');

// Game data structures
class Player {
    constructor(id, username) {
        this.id = id;
        this.username = username;
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;
        this.gold = 0;
        this.inventory = [];
        this.equipped = {
            weapon: null,
            armor: null
        };
        this.location = 'town';
        this.inCombat = false;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health > 0;
    }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.exp -= this.expToLevel;
        this.expToLevel = Math.floor(this.expToLevel * 1.5);
    }
}

const ITEMS = {
    'wooden_sword': { name: 'Wooden Sword', type: 'weapon', damage: 10, cost: 50 },
    'iron_sword': { name: 'Iron Sword', type: 'weapon', damage: 20, cost: 150 },
    'leather_armor': { name: 'Leather Armor', type: 'armor', defense: 5, cost: 100 },
    'iron_armor': { name: 'Iron Armor', type: 'armor', defense: 15, cost: 200 },
    'health_potion': { name: 'Health Potion', type: 'consumable', heal: 50, cost: 30 }
};

const LOCATIONS = {
    town: {
        name: 'Town',
        description: 'A peaceful town with shops and an inn.',
        actions: ['shop', 'heal', 'inventory', 'status'],
        connections: ['forest', 'cave']
    },
    forest: {
        name: 'Forest',
        description: 'A dark forest filled with weak monsters.',
        actions: ['fight', 'inventory', 'status'],
        connections: ['town', 'cave'],
        monsters: ['wolf', 'bandit']
    },
    cave: {
        name: 'Cave',
        description: 'A dangerous cave with powerful monsters.',
        actions: ['fight', 'inventory', 'status'],
        connections: ['town', 'forest'],
        monsters: ['troll', 'dragon']
    }
};

const MONSTERS = {
    wolf: {
        name: 'Wolf',
        health: 50,
        damage: 10,
        exp: 30,
        gold: 20
    },
    bandit: {
        name: 'Bandit',
        health: 70,
        damage: 15,
        exp: 45,
        gold: 40
    },
    troll: {
        name: 'Troll',
        health: 120,
        damage: 25,
        exp: 80,
        gold: 100
    },
    dragon: {
        name: 'Dragon',
        health: 200,
        damage: 40,
        exp: 150,
        gold: 300
    }
};

// Game state management
const players = new Map();
const activeCombats = new Map();

module.exports = {
    name: 'adventure',
    description: 'Start an adventure game!',
    async execute(message, args) {
        let player = players.get(message.author.id);
        
        if (!player) {
            player = new Player(message.author.id, message.author.username);
            players.set(message.author.id, player);
        }

        // Create main game embed
        const gameEmbed = new EmbedBuilder()
            .setTitle(`${player.username}'s Adventure`)
            .setDescription(getLocationDescription(player))
            .addFields(
                { name: 'Status', value: getPlayerStatus(player), inline: true },
                { name: 'Location', value: LOCATIONS[player.location].name, inline: true }
            )
            .setColor('Blue');

        // Create action buttons
        const actionRow = new ActionRowBuilder().addComponents(
            ...getLocationButtons(player)
        );

        const gameMessage = await message.channel.send({
            embeds: [gameEmbed],
            components: [actionRow]
        });

        // Create button collector
        const collector = gameMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== player.id) {
                await interaction.reply({ 
                    content: "This isn't your game!", 
                    ephemeral: true 
                });
                return;
            }

            await handleGameAction(interaction, player, gameMessage);
        });

        collector.on('end', async () => {
            await gameMessage.edit({ components: [] });
        });
    }
};

// Helper functions
function getLocationDescription(player) {
    const location = LOCATIONS[player.location];
    return `${location.description}\n\nAvailable actions: ${location.actions.join(', ')}\nConnected locations: ${location.connections.join(', ')}`;
}

function getPlayerStatus(player) {
    return `HP: ${player.health}/${player.maxHealth}\nLevel: ${player.level}\nEXP: ${player.exp}/${player.expToLevel}\nGold: ${player.gold}`;
}

function getLocationButtons(player) {
    const location = LOCATIONS[player.location];
    const buttons = [];

    // Add action buttons
    for (const action of location.actions) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(action)
                .setLabel(action.charAt(0).toUpperCase() + action.slice(1))
                .setStyle(ButtonStyle.Primary) // Ensure this is a valid style
        );
    }

    // Add travel buttons
    for (const connection of location.connections) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`travel_${connection}`)
                .setLabel(`Go to ${connection.charAt(0).toUpperCase() + connection.slice(1)}`)
                .setStyle(ButtonStyle.Secondary) // Ensure this is a valid style
        );
    }

    // Split buttons into multiple ActionRows (max 5 per row)
    const actionRows = [];
    for (let i = 0; i < buttons.length; i += 5) {
        actionRows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    return actionRows; // Return multiple rows instead of a single one
}

async function handleGameAction(interaction, player, gameMessage) {
    const action = interaction.customId;

    if (action.startsWith('travel_')) {
        const destination = action.split('_')[1];
        player.location = destination;
        player.inCombat = false;
    } else {
        switch (action) {
            case 'fight':
                await handleCombat(interaction, player);
                break;
            case 'shop':
                await handleShop(interaction, player);
                break;
            case 'heal':
                if (player.gold >= 10) {
                    player.gold -= 10;
                    player.heal(player.maxHealth);
                    await interaction.reply('You have been healed!');
                } else {
                    await interaction.reply('Not enough gold to heal!');
                }
                break;
            case 'inventory':
                await showInventory(interaction, player);
                break;
            case 'status':
                await showStatus(interaction, player);
                break;
        }
    }

    // Update game message
    const updatedEmbed = new EmbedBuilder()
        .setTitle(`${player.username}'s Adventure`)
        .setDescription(getLocationDescription(player))
        .addFields(
            { name: 'Status', value: getPlayerStatus(player), inline: true },
            { name: 'Location', value: LOCATIONS[player.location].name, inline: true }
        )
        .setColor('Blue');

    const updatedActionRow = new ActionRowBuilder().addComponents(
        ...getLocationButtons(player)
    );

    await gameMessage.edit({
        embeds: [updatedEmbed],
        components: [updatedActionRow]
    });

    if (!interaction.replied && !interaction.deferred) {
        await interaction.deferUpdate();
    }
}

async function handleCombat(interaction, player) {
    if (player.inCombat) {
        await interaction.reply('You are already in combat!');
        return;
    }

    const location = LOCATIONS[player.location];
    const monsterType = location.monsters[Math.floor(Math.random() * location.monsters.length)];
    const monster = { ...MONSTERS[monsterType], currentHealth: MONSTERS[monsterType].health };

    const combatEmbed = new EmbedBuilder()
        .setTitle('Combat')
        .setDescription(`A ${monster.name} appears!`)
        .addFields(
            { name: 'Your HP', value: `${player.health}/${player.maxHealth}`, inline: true },
            { name: `${monster.name}'s HP`, value: `${monster.currentHealth}/${monster.health}`, inline: true }
        )
        .setColor('Red');

    const combatButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('attack')
            .setLabel('Attack')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('flee')
            .setLabel('Flee')
            .setStyle(ButtonStyle.Secondary)
    );

    const combatMessage = await interaction.reply({
        embeds: [combatEmbed],
        components: [combatButtons],
        fetchReply: true
    });

    player.inCombat = true;
    activeCombats.set(player.id, { monster, message: combatMessage });

    const combatCollector = combatMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
    });

    combatCollector.on('collect', async (i) => {
        if (i.user.id !== player.id) {
            await i.reply({ content: "This isn't your combat!", ephemeral: true });
            return;
        }

        const combat = activeCombats.get(player.id);
        if (!combat) return;

        if (i.customId === 'attack') {
            // Player attacks
            const playerDamage = 10 + (player.equipped.weapon ? ITEMS[player.equipped.weapon].damage : 0);
            combat.monster.currentHealth -= playerDamage;

            if (combat.monster.currentHealth <= 0) {
                // Monster defeated
                player.addExp(combat.monster.exp);
                player.gold += combat.monster.gold;
                player.inCombat = false;
                activeCombats.delete(player.id);

                await i.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Victory!')
                            .setDescription(`You defeated the ${combat.monster.name}!\nGained ${combat.monster.exp} EXP and ${combat.monster.gold} gold!`)
                            .setColor('Green')
                    ],
                    components: []
                });
                return;
            }

            // Monster attacks
            const monsterDamage = Math.max(1, combat.monster.damage - (player.equipped.armor ? ITEMS[player.equipped.armor].defense : 0));
            if (!player.takeDamage(monsterDamage)) {
                // Player died
                player.health = player.maxHealth;
                player.gold = Math.floor(player.gold * 0.5);
                player.location = 'town';
                player.inCombat = false;
                activeCombats.delete(player.id);

                await i.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Defeat!')
                            .setDescription('You have been defeated and lost half your gold!\nYou wake up in town...')
                            .setColor('Red')
                    ],
                    components: []
                });
                return;
            }

            // Update combat embed
            await i.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Combat')
                        .setDescription(`You deal ${playerDamage} damage!\nThe ${combat.monster.name} deals ${monsterDamage} damage!`)
                        .addFields(
                            { name: 'Your HP', value: `${player.health}/${player.maxHealth}`, inline: true },
                            { name: `${combat.monster.name}'s HP`, value: `${combat.monster.currentHealth}/${combat.monster.health}`, inline: true }
                        )
                        .setColor('Red')
                ],
                components: [combatButtons]
            });

        } else if (i.customId === 'flee') {
            player.inCombat = false;
            activeCombats.delete(player.id);
            await i.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Fled!')
                        .setDescription('You successfully fled from combat!')
                        .setColor('Grey')
                ],
                components: []
            });
        }
    });
}

async function handleShop(interaction, player) {
    const shopEmbed = new EmbedBuilder()
        .setTitle('Shop')
        .setDescription('Welcome to the shop! What would you like to buy?')
        .addFields(
            Object.entries(ITEMS).map(([id, item]) => ({
                name: `${item.name} (${item.cost} gold)`,
                value: `Type: ${item.type}\n${item.damage ? `Damage: ${item.damage}` : item.defense ? `Defense: ${item.defense}` : `Heal: ${item.heal}`}`,
                inline: true
            }))
        )
        .setColor('Gold');

    const shopButtons = new ActionRowBuilder().addComponents(
        Object.keys(ITEMS).map(id => 
            new ButtonBuilder()
                .setCustomId(`buy_${id}`)
                .setLabel(`Buy ${ITEMS[id].name}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(player.gold < ITEMS[id].cost)
        )
    );

    await interaction.reply({
        embeds: [shopEmbed],
        components: [shopButtons],
        ephemeral: true
    });
}

async function showInventory(interaction, player) {
    const inventoryEmbed = new EmbedBuilder()
        .setTitle('Inventory')
        .setDescription('Your items:')
        .addFields(
            { name: 'Equipment', value: `Weapon: ${player.equipped.weapon ? ITEMS[player.equipped.weapon].name : 'None'}\nArmor: ${player.equipped.armor ? ITEMS[player.equipped.armor].name : 'None'}` },
            { name: 'Items', value: player.inventory.length > 0 ? player.inventory.map(id => ITEMS[id].name).join('\n') : 'No items' }
        )
        .setColor('Purple');

    await interaction.reply({
        embeds: [inventoryEmbed],
        ephemeral: true
    });
}
async function showStatus(interaction, player) {
    const equipped = {
        weapon: player.equipped.weapon ? ITEMS[player.equipped.weapon] : null,
        armor: player.equipped.armor ? ITEMS[player.equipped.armor] : null
    };

    const statusEmbed = new EmbedBuilder()
        .setTitle(`${player.username}'s Status`)
        .addFields(
            { name: 'Level', value: `${player.level} (${player.exp}/${player.expToLevel} EXP)`, inline: true },
            { name: 'Health', value: `${player.health}/${player.maxHealth}`, inline: true },
            { name: 'Gold', value: player.gold.toString(), inline: true },
            { name: 'Equipment', value: `Weapon: ${equipped.weapon ? equipped.weapon.name : 'None'} (${equipped.weapon ? `+${equipped.weapon.damage} DMG` : '0 DMG'})\nArmor: ${equipped.armor ? equipped.armor.name : 'None'} (${equipped.armor ? `+${equipped.armor.defense} DEF` : '0 DEF'})` }
        )
        .setColor('Green');

    await interaction.reply({
        embeds: [statusEmbed],
        ephemeral: true
    });
}

// Item management functions
async function handleItemUse(interaction, player, itemId) {
    const item = ITEMS[itemId];
    const itemIndex = player.inventory.indexOf(itemId);
    
    if (itemIndex === -1) {
        await interaction.reply({
            content: "You don't have this item!",
            ephemeral: true
        });
        return;
    }

    switch (item.type) {
        case 'weapon':
            if (player.equipped.weapon) {
                player.inventory.push(player.equipped.weapon);
            }
            player.equipped.weapon = itemId;
            player.inventory.splice(itemIndex, 1);
            await interaction.reply({
                content: `Equipped ${item.name}!`,
                ephemeral: true
            });
            break;

        case 'armor':
            if (player.equipped.armor) {
                player.inventory.push(player.equipped.armor);
            }
            player.equipped.armor = itemId;
            player.inventory.splice(itemIndex, 1);
            await interaction.reply({
                content: `Equipped ${item.name}!`,
                ephemeral: true
            });
            break;

        case 'consumable':
            if (item.heal) {
                player.heal(item.heal);
                player.inventory.splice(itemIndex, 1);
                await interaction.reply({
                    content: `Used ${item.name} and restored ${item.heal} HP!`,
                    ephemeral: true
                });
            }
            break;
    }
}

async function handleItemPurchase(interaction, player, itemId) {
    const item = ITEMS[itemId];
    
    if (player.gold < item.cost) {
        await interaction.reply({
            content: "You don't have enough gold!",
            ephemeral: true
        });
        return;
    }

    player.gold -= item.cost;
    player.inventory.push(itemId);
    
    await interaction.reply({
        content: `Purchased ${item.name} for ${item.cost} gold!`,
        ephemeral: true
    });
}

// Add button handler for item-related actions
async function handleItemButton(interaction, player, buttonId) {
    const [action, itemId] = buttonId.split('_');
    
    switch (action) {
        case 'buy':
            await handleItemPurchase(interaction, player, itemId);
            break;
        case 'use':
            await handleItemUse(interaction, player, itemId);
            break;
        case 'unequip':
            const slot = itemId; // 'weapon' or 'armor'
            if (player.equipped[slot]) {
                player.inventory.push(player.equipped[slot]);
                player.equipped[slot] = null;
                await interaction.reply({
                    content: `Unequipped ${ITEMS[player.equipped[slot]].name}!`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "Nothing to unequip!",
                    ephemeral: true
                });
            }
            break;
    }
}

// Add save/load functionality
const fs = require('fs').promises;
const path = require('path');

async function saveGame(player) {
    const savePath = path.join(__dirname, 'saves', `${player.id}.json`);
    await fs.mkdir(path.dirname(savePath), { recursive: true });
    await fs.writeFile(savePath, JSON.stringify(player), 'utf8');
}

async function loadGame(playerId) {
    try {
        const savePath = path.join(__dirname, 'saves', `${playerId}.json`);
        const data = await fs.readFile(savePath, 'utf8');
        const savedPlayer = JSON.parse(data);
        
        // Create new player instance with saved data
        const player = new Player(savedPlayer.id, savedPlayer.username);
        Object.assign(player, savedPlayer);
        
        return player;
    } catch (error) {
        return null;
    }
}

// Add auto-save functionality
setInterval(() => {
    players.forEach(async (player) => {
        await saveGame(player);
    });
}, 300000); // Auto-save every 5 minutes

// Add some utility functions for game balance
function calculateDamage(baseDamage, level) {
    return Math.floor(baseDamage * (1 + (level - 1) * 0.1));
}

function calculateExpGain(baseExp, playerLevel, monsterLevel) {
    const levelDifference = monsterLevel - playerLevel;
    const multiplier = Math.max(0.1, 1 + levelDifference * 0.1);
    return Math.floor(baseExp * multiplier);
}

// Error handling wrapper
function errorHandler(fn) {
    return async function(...args) {
        try {
            await fn(...args);
        } catch (error) {
            console.error('Game error:', error);
            const interaction = args[0];
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'An error occurred! Please try again.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'An error occurred! Please try again.',
                    ephemeral: true
                });
            }
        }
    };
}
