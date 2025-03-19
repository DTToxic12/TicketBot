const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
    SlashCommandBuilder
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const TICKET_TYPES = {
    'temp-mod': {
        category: 'MOD_CATEGORY_ID',
        embedContent: {
            title: 'Ticket Information',
            description: 'Thank you for showing interest in becoming a temp mod! Please provide us with your youtube name, fortnite name and your reason why we should make you temp mod'
        }
    },
    'support': {
        category: 'SUPPORT_CATEGORY_ID',
        embedContent: {
            title: 'Support Ticket',
            description: 'Please describe your issue and a staff member will assist you shortly.'
        }
    },
    'report': {
        category: 'REPORT_CATEGORY_ID',
        embedContent: {
            title: 'Report Ticket',
            description: 'Please provide details about your report including any evidence.'
        }
    }
};

const closeTimers = new Map();

client.once('ready', () => {
    console.log('Ticket Bot is online!');
    registerCommands();
});

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Create a new ticket')
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('Type of ticket')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Temp Mod Application', value: 'temp-mod' },
                        { name: 'Support', value: 'support' },
                        { name: 'Report', value: 'report' }
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
        await client.application.commands.set(commands);
        console.log('Slash commands registered');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        switch (interaction.commandName) {
            case 'ticket':
                await handleTicketCreation(interaction);
                break;
            case 'forceclose':
                await handleForceClose(interaction);
                break;
            case 'close':
                await handleClose(interaction);
                break;
            case 'cancelclose':
                await handleCancelClose(interaction);
                break;
        }
    } else if (interaction.isButton()) {
        switch (interaction.customId) {
            case 'claim_ticket':
                await handleTicketClaim(interaction);
                break;
            case 'close_ticket':
                await handleClose(interaction);
                break;
        }
    }
});

async function handleTicketCreation(interaction) {
    const ticketType = interaction.options.getString('type');
    const ticketConfig = TICKET_TYPES[ticketType];

    if (!ticketConfig) {
        return await interaction.reply({ content: 'Invalid ticket type!', ephemeral: true });
    }

    const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}-${ticketType}`,
        type: ChannelType.GuildText,
        parent: ticketConfig.category,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
                id: client.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            }
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle(ticketConfig.embedContent.title)
        .setDescription(`${ticketConfig.embedContent.description}\n\n<@${interaction.user.id}>`)
        .setColor('#0099ff')
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('Claim')
                .setEmoji('📥')
                .setStyle(ButtonStyle.Primary)
        );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Ticket created! ${channel}`, ephemeral: true });
}

async function handleTicketClaim(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({ content: 'You do not have permission to claim tickets!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('Ticket Claimed')
        .setDescription(`This ticket has been claimed by ${interaction.user}`)
        .setColor('#00ff00')
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleClose(interaction) {
    const channel = interaction.channel;
    
    if (closeTimers.has(channel.id)) {
        return await interaction.reply({ content: 'Ticket is already in closing process!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('Ticket Closing')
        .setDescription('This ticket will be closed in 60 seconds. Use `/cancelclose` to cancel.')
        .setColor('#ff0000')
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    closeTimers.set(channel.id, setTimeout(async () => {
        try {
            await channel.delete();
            closeTimers.delete(channel.id);
        } catch (error) {
            console.error('Error deleting channel:', error);
        }
    }, 60000));
}

async function handleCancelClose(interaction) {
    const timer = closeTimers.get(interaction.channel.id);
    
    if (!timer) {
        return await interaction.reply({ content: 'No active closing process to cancel!', ephemeral: true });
    }

    clearTimeout(timer);
    closeTimers.delete(interaction.channel.id);

    const embed = new EmbedBuilder()
        .setTitle('Close Cancelled')
        .setDescription('The ticket closing process has been cancelled.')
        .setColor('#00ff00')
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleForceClose(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({ content: 'You do not have permission to force close tickets!', ephemeral: true });
    }

    try {
        await interaction.channel.delete();
    } catch (error) {
        await interaction.reply({ content: 'Error closing the ticket!', ephemeral: true });
        console.error('Error force closing ticket:', error);
    }
}

client.login('YOUR_BOT_TOKEN');