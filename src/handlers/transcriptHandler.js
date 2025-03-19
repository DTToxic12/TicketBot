const { Octokit } = require('@octokit/rest');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = process.env.GITHUB_USERNAME;
const REPO_NAME = process.env.GITHUB_REPO;

async function saveTranscript(channel, closer) {
    try {
        // Generate transcript
        const transcript = await createTranscript(channel, {
            limit: -1,
            returnBuffer: false,
            fileName: `transcript-${channel.name}.html`
        });

        const transcriptId = generateTranscriptId();
        const fileName = `${transcriptId}.html`;

        // Push to GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: `transcripts/${fileName}`,
            message: `Ticket transcript: ${channel.name}`,
            content: Buffer.from(transcript).toString('base64'),
            branch: 'main'
        });

        // Create embed with transcript link
        const embed = new EmbedBuilder()
            .setTitle('Ticket Closed')
            .setDescription(`Ticket closed by ${closer.tag}`)
            .addFields(
                { 
                    name: 'Transcript', 
                    value: `[View Transcript](https://${REPO_OWNER}.github.io/${REPO_NAME}/transcripts/${fileName})` 
                }
            )
            .setColor('#ff0000')
            .setTimestamp();

        // Send to logs channel if configured
        if (process.env.TRANSCRIPT_LOGS_CHANNEL) {
            const logsChannel = channel.guild.channels.cache.get(process.env.TRANSCRIPT_LOGS_CHANNEL);
            if (logsChannel) {
                await logsChannel.send({ embeds: [embed] });
            }
        }

        return transcriptId;
    } catch (error) {
        console.error('Error saving transcript:', error);
        throw error;
    }
}

function generateTranscriptId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = { saveTranscript };


