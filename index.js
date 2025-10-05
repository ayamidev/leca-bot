// index.js
const { Client, GatewayIntentBits, InteractionResponseFlags, Partials } = require('discord.js');
require('dotenv').config();
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

let logChannelId;

// Servidor web mínimo para Render
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Leca está online! 💕'));
app.listen(port, () => console.log(`Servidor HTTP ativo na porta ${port}`));

// Função para horário de Brasília
function horaBrasilia() {
  const agora = new Date();
  const brasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const data = brasilia.toISOString().replace('T', ' ').slice(0, 19);
  return data.replace(/-/g, '/');
}

client.once('clientReady', () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// Comando para definir canal de log
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setlog') {
    logChannelId = interaction.channel.id;
    await interaction.reply({
      content: 'Canal de log definido com sucesso!',
      flags: InteractionResponseFlags.Ephemeral
    });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 🔒 Evita processar respostas a mensagens do próprio bot
  if (message.reference) {
    const ref = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (ref && ref.author.id === client.user.id) return;
  }

  const mentionsBot = message.mentions.has(client.user);
  const hasAttachments = message.attachments.size > 0;
  const hasContent = message.content.replace(`<@${client.user.id}>`, '').trim().length > 0;

  if (!mentionsBot) return;
  if (!hasContent && !hasAttachments) return;

  const cleanContent = message.content.replace(`<@${client.user.id}>`, '').trim();
  const files = hasAttachments ? Array.from(message.attachments.values()).map(a => a.url) : [];

  // 💌 Repost anônimo
  try {
    if (hasContent) {
      await message.channel.send({
        content: 'sua mensagem foi escondida 💕',
      });
      await message.channel.send({
        embeds: [{
          description: cleanContent
        }],
        files: files.length > 0 ? files : undefined
      });
    } else if (hasAttachments) {
      // Apenas anexos → repost direto sem embed
      await message.channel.send({
        content: 'sua mensagem foi escondida 💕',
        files: files
      });
    }
  } catch (err) {
    console.error('Erro ao repostar:', err);
  }

  // 🗃️ Log de auditoria
  if (logChannelId) {
    try {
      const logChannel = await client.channels.fetch(logChannelId);
      const descriptionText = hasContent
        ? `**mensagem:** ${cleanContent}`
        : '_Postagem sem descrição_';

      await logChannel.send({
        content: 'Registro de Auditoria 💕',
        embeds: [{
          description: descriptionText,
          footer: {
            text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${horaBrasilia()}`
          }
        }],
        files: files.length > 0 ? files : undefined
      });
    } catch (err) {
      console.error('Erro ao enviar log:', err);
    }
  }

  // ❌ Deleta mensagem original
  await message.delete().catch(() => {});
});

client.login(process.env.TOKEN);
