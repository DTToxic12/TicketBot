const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const { TICKET_TYPES } = require('../config/TicketTypes');
const { saveTranscript } = require('./transcriptHandler');
const BASE_URL = `${process.env.WEBSITE_URL}:${process.env.PORT}`;

async function handleTicketCreation(interaction) {
    try {
        const ticketType = interaction.options.getString('type');
        const ticketConfig = TICKET_TYPES[ticketType];

        if (!ticketConfig) {
            return await interaction.reply({ 
                content: `Invalid ticket type: ${ticketType}`, 
                ephemeral: true 
            });
        }

        // Check if user already has a ticket of this type
        const existingTicket = interaction.guild.channels.cache.find(
            channel => channel.name.toLowerCase() === `ticket-${interaction.user.username.toLowerCase()}-${ticketType}`
        );

        if (existingTicket) {
            return await interaction.reply({ 
                content: `You already have an open ${ticketConfig.name} ticket: ${existingTicket}`, 
                ephemeral: true 
            });
        }

        // Create the ticket channel
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
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ],
                },
                {
                    id: interaction.client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels
                    ],
                }
            ]
        });

        const embed = new EmbedBuilder()
            .setTitle(ticketConfig.embedContent.title)
            .setDescription(ticketConfig.embedContent.description)
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
        await channel.send(`<@${interaction.user.id}> Welcome to your ticket!`);
        
        return await interaction.reply({ 
            content: `Ticket created! ${channel}`, 
            ephemeral: true 
        });
    } catch (error) {
        console.error('Error in handleTicketCreation:', error);
        throw error; // Re-throw the error for proper handling
    }
}

async function handleTicketClose(interaction) {
    try {
        const channel = interaction.channel;
        
        // Verify this is a ticket channel
        if (!channel.name.startsWith('ticket-')) {
            return await interaction.reply({
                content: 'This command can only be used in ticket channels!',
                ephemeral: true
            });
        }

        // Disable the buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Claim')
                    .setEmoji('📥')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            );

        // Update the original message with disabled buttons
        if (interaction.message) {
            await interaction.message.edit({
                components: [row]
            }).catch(console.error);
        }

        // Send closing message
        await interaction.reply({
            content: 'Closing ticket in 5 seconds...',
            ephemeral: true
        });

        try {
            // Save transcript
            const transcriptId = await saveTranscript(channel, interaction.user);
            
            // Send transcript confirmation
            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Ticket Closed')
                        .setDescription(`Ticket closed by ${interaction.user.tag}`)
                        .addFields(
                            { name: 'Transcript', value: `[View Transcript](${BASE_URL}/transcript/${transcriptId})` }
                        )
                        .setColor('#ff0000')
                        .setTimestamp()
                ]
            });

            // Delete the channel after delay
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (err) {
                    console.error('Error deleting channel:', err);
                }
            }, 5000);

        } catch (err) {
            console.error('Error saving transcript:', err);
            await interaction.followUp({
                content: 'Error saving transcript, but closing ticket anyway.',
                ephemeral: true
            });
            
            // Delete the channel even if transcript fails
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (err) {
                    console.error('Error deleting channel:', err);
                }
            }, 5000);
        }
    } catch (error) {
        console.error('Error in handleTicketClose:', error);
        await interaction.reply({
            content: 'There was an error closing the ticket.',
            ephemeral: true
        }).catch(console.error);
    }
}

module.exports = { 
    handleTicketCreation, 
    handleTicketClose 
};




