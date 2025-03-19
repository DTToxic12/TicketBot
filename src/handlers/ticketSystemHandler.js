const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle
} = require('discord.js');
const { handleTicketCreation } = require('./ticketHandler');

async function handleTicketSystem(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
        return await interaction.reply({ 
            content: 'You do not have permission to use this command!', 
            ephemeral: true 
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket System')
        .setDescription('Click the button below to create a ticket!')
        .setColor('#0099ff')
        .addFields(
            { 
                name: '📝 Temp Mod Application', 
                value: 'Apply to become a temporary moderator' 
            },
            { 
                name: '❓ Support', 
                value: 'Get help with any issues' 
            },
            { 
                name: '⚠️ Report', 
                value: 'Report a user or bug' 
            }
        )
        .setFooter({ text: 'Click the buttons below to open a ticket' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket_temp-mod')
                .setLabel('Temp Mod Application')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('create_ticket_support')
                .setLabel('Support')
                .setEmoji('❓')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('create_ticket_report')
                .setLabel('Report')
                .setEmoji('⚠️')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({ content: 'Ticket system created!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
}

async function handleTicketButtonInteraction(interaction) {
    try {
        const ticketType = interaction.customId.split('create_ticket_')[1];
        
        if (!ticketType) {
            return await interaction.reply({ 
                content: 'Invalid ticket type!', 
                ephemeral: true 
            });
        }

        // Create a mock interaction with the necessary properties
        const mockInteraction = {
            options: {
                getString: (name) => name === 'type' ? ticketType : null
            },
            guild: interaction.guild,
            client: interaction.client,
            user: interaction.user,
            member: interaction.member,
            channel: interaction.channel,
            reply: interaction.reply.bind(interaction),
            deferReply: interaction.deferReply.bind(interaction),
            followUp: interaction.followUp.bind(interaction),
            editReply: interaction.editReply.bind(interaction)
        };

        await handleTicketCreation(mockInteraction);
    } catch (error) {
        console.error('Error handling ticket button:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'There was an error creating your ticket. Please try again later.', 
                ephemeral: true 
            });
        }
    }
}

module.exports = { handleTicketSystem, handleTicketButtonInteraction };




