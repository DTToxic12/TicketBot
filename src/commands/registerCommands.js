const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TICKET_TYPES } = require('../config/TicketTypes');

async function registerCommands(client) {
    const commands = [
        new SlashCommandBuilder()
            .setName('ticket-system')
            .setDescription('Create the ticket system message with buttons')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Create a new ticket')
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('Type of ticket')
                    .setRequired(true)
                    .addChoices(
                        ...Object.values(TICKET_TYPES).map(type => ({
                            name: type.name,
                            value: type.id
                        }))
                    )),
        new SlashCommandBuilder()
            .setName('forceclose')
            .setDescription('Force close a ticket')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('close')
            .setDescription('Start the ticket closing process'),
        new SlashCommandBuilder()
            .setName('cancelclose')
            .setDescription('Cancel the ticket closing process')
    ];

    try {
        console.log('Started refreshing application (/) commands.');
        
        // Convert the commands to JSON
        const commandsData = commands.map(command => command.toJSON());
        
        // Register the commands
        await client.application.commands.set(commandsData);
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

module.exports = { registerCommands };

