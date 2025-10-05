const { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder } = require("discord.js");
require("dotenv").config();
const express = require("express");

const TOKEN = process.env.TOKEN;
const BOT_NAME = "leca"; // Nome do bot para detectar menção direta
let logChannelId = null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel]
});

// --- Web server mínimo para Render ---
const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot Leca está online! 💕"));
app.listen(port, () => console.log(`Servidor HTTP ativo na porta ${port}`));

// --- Função pra horário de Brasília ---
function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false
  });
}

// --- Bot pronto ---
client.once("ready", () => {
  console.log(`✅ Logado como ${client.user.tag}`);
});

// --- Comando para definir canal de log ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "setlog") {
    logChannelId = interaction.channel.id;
    await interaction.reply({
      content: "Canal de log definido com sucesso!",
      ephemeral: true
    });
  }
});

// --- Repost anônimo ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ignora respostas a mensagens do próprio bot
  if (message.reference) {
    const ref = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (ref && ref.author.id === client.user.id) return;
  }

  const contentLower = message.content.toLowerCase();
  if (!contentLower.includes(`@${BOT_NAME}`)) return; // só reage se mencionar "@leca"

  // remove a menção do conteúdo
  const cleanContent = message.content.replace(new RegExp(`@${BOT_NAME}`, "gi"), "").trim();

  // converte anexos para AttachmentBuilder
  const files = message.attachments.map(a => new AttachmentBuilder(a.url, { name: a.name }));

  if (!cleanContent && files.length === 0) return; // nada a fazer

  await message.delete().catch(() => {});

  if (cleanContent) {
    const embed = new EmbedBuilder().setDescription(cleanContent);
    await message.channel.send({
      content: "sua mensagem foi escondida 💕",
      embeds: [embed],
      files: files.length > 0 ? files : undefined
    });
  } else {
    await message.channel.send({
      content: "sua mensagem foi escondida 💕",
      files
    });
  }

  // log no canal definido
  if (logChannelId) {
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const descricao = cleanContent || "* (postagem sem descrição)*";
      const embed = new EmbedBuilder()
        .setDescription(`**mensagem:** ${descricao}`)
        .setFooter({
          text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${horaBrasilia()}`
        });

      await logChannel.send({
        content: "Registro de Auditoria 💕",
        embeds: [embed],
        files: files.length > 0 ? files : undefined
      });
    }
  }
});

client.login(TOKEN);
