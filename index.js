// index.js
import { Client, GatewayIntentBits, Partials, EmbedBuilder, InteractionResponseFlags } from "discord.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

// === CONFIGURAÇÃO DO CLIENTE ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// === VARIÁVEIS ===
const TOKEN = process.env.TOKEN;
let LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// === WEBSERVER MÍNIMO (Render) ===
const app = express();
app.get("/", (_, res) => res.send("💖 Leca está online!"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Servidor HTTP ativo!"));

// === UTILITÁRIO: HORÁRIO BRASIL ===
function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });
}

// === EVENTO: BOT PRONTO ===
client.once("clientReady", () => {
  console.log(`🤖 Leca conectada como ${client.user.tag}`);
});

// === COMANDOS (exemplo /setlog) ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "setlog") {
    LOG_CHANNEL_ID = interaction.channel.id;
    await interaction.reply({
      content: "Canal de log definido com sucesso!",
      flags: InteractionResponseFlags.Ephemeral
    });
  }
});

// === FUNÇÃO DE LOG ===
async function registrarLog(message, conteudo, arquivos) {
  if (!LOG_CHANNEL_ID) return;
  const canalLog = await message.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (!canalLog) return;

  const horario = horaBrasilia();
  const embed = new EmbedBuilder()
    .setDescription(`**mensagem:** ${conteudo || "* (postagem sem descrição)*"}`)
    .setFooter({
      text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${horario}`,
    });

  await canalLog.send({
    content: "Registro de Auditoria 💕",
    embeds: [embed],
    files: arquivos.length > 0 ? arquivos : undefined,
  });
}

// === FUNÇÃO PRINCIPAL: REPOST ANÔNIMO ===
async function repostarAnonimamente(message) {
  if (message.author.bot) return;

  // detecta menções
  const mentionedBot = message.mentions.has(client.user);
  const mentionedEveryone = message.mentions.everyone;
  const mentionedHere = message.content.includes("@here");

  // ignora se não houver menção direta ao bot
  if (!mentionedBot) return;
  if (!mentionedBot && (mentionedEveryone || mentionedHere)) return;

  // remove apenas a menção ao bot, mantendo outras menções
  const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();

  const files = message.attachments.map(a => a.url);
  if (!cleanContent && files.length === 0) return;

  // captura resposta original
  let replyTo = null;
  if (message.reference) {
    replyTo = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
  }

  // apaga a mensagem original
  await message.delete().catch(() => {});

  // cria embed se houver texto
  const embed = cleanContent ? new EmbedBuilder().setDescription(cleanContent) : null;

  // envia repost anônimo
  await message.channel.send({
    content: "sua mensagem foi escondida 💕",
    embeds: embed ? [embed] : undefined,
    files: files.length > 0 ? files : undefined,
    reply: replyTo ? { messageReference: replyTo.id } : undefined,
  });

  // registra log
  await registrarLog(message, cleanContent, files);
}

// === EVENTO: NOVA MENSAGEM ===
client.on("messageCreate", repostarAnonimamente);

// === LOGIN ===
client.login(TOKEN);
