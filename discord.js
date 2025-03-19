require('dotenv').config();

const { 
    Client, 
    GatewayIntentBits,
    REST,
    Routes,
    PermissionFlagsBits
} = require('discord.js');

const { registerCommands } = require('./src/commands/registerCommands');
const { handleTicketSystem, handleTicketButtonInteraction } = require('./src/handlers/ticketSystemHandler');
const { handleTicketCreation, handleTicketClose } = require('./src/handlers/ticketHandler');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            switch (interaction.commandName) {
                case 'ticket-system':
                    await handleTicketSystem(interaction);
                    break;
                case 'ticket':
                    await handleTicketCreation(interaction);
                    break;
                case 'close':
                    await handleTicketClose(interaction);
                    break;
            }
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('create_ticket_')) {
                await handleTicketButtonInteraction(interaction);
            } else if (interaction.customId === 'close_ticket') {
                await handleTicketClose(interaction);
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            }).catch(console.error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);


