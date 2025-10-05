// index.js
const { Client, GatewayIntentBits, InteractionResponseFlags, Partials } = require('discord.js');
require('dotenv').config();
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

// Variável para armazenar o canal de logs
let logChannelId;

// Web server mínimo para Render
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Leca está online!'));
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

// Função para pegar hora em Brasília
function horaBrasilia() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false });
}

client.once('ready', () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setlog') {
    logChannelId = interaction.channel.id;
    await interaction.reply({
      content: 'Canal de log definido!',
      flags: InteractionResponseFlags.Ephemeral
    });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const mentionsBot = message.mentions.has(client.user);
  const hasAttachments = message.attachments.size > 0;
  const hasContent = message.content.replace(`<@${client.user.id}>`, '').trim().length > 0;

  // Regra: apenas @ com anexos → repost normal, apenas @ sem anexos → ignora
  if (!mentionsBot) return;
  if (!hasContent && !hasAttachments) return;

  // Repost no canal original
  if (hasContent) {
    await message.channel.send({ content: message.content.replace(`<@${client.user.id}>`, '').trim(), files: hasAttachments ? Array.from(message.attachments.values()).map(a => a.url) : undefined });
  } else if (hasAttachments) {
    await message.channel.send({ files: Array.from(message.attachments.values()).map(a => a.url) });
  }

  // Log
  if (logChannelId) {
    const logChannel = await client.channels.fetch(logChannelId);
    const files = hasAttachments ? Array.from(message.attachments.values()).map(a => a.url) : [];

    const descriptionText = hasContent ? `**mensagem:** ${message.content.replace(`<@${client.user.id}>`, '').trim()}` : '_Postagem sem descrição_';

    await logChannel.send({
      embeds: [{
        description: descriptionText,
        fields: [
          {
            name: 'Informações',
            value: `**Autor:** ${message.author.tag} | (${message.author.id})\n**Canal:** <#${message.channel.id}> | ${horaBrasilia()}`
          }
        ],
        files: files.length > 0 ? files : undefined
      }]
    });
  }

  // Deleta a mensagem original
  await message.delete().catch(() => {});
});

client.login(process.env.TOKEN);
