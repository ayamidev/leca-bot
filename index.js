import Discord, { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder } from "discord.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

// === CLIENTE DISCORD ===
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
let LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || null;

// === WEBSERVER PARA MANTER ONLINE ===
const app = express();
app.get("/", (_, res) => res.send("💖 Leca está online!"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Servidor HTTP ativo!"));

// === HORÁRIO BRASIL ===
function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });
}

// === EVENTO PRONTO ===
client.once("clientReady", () => {
  console.log(`🤖 Leca conectada como ${client.user.tag}`);
  console.log("Servidores:", client.guilds.cache.map(g => g.name).join(", "));
});

// === COMANDO SIMPLES /setlog ===
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!setlog")) return;
  if (!message.member || !message.member.permissions.has("Administrator")) return;

  LOG_CHANNEL_ID = message.channel.id;
  await message.reply("Canal de log definido com sucesso!");
});

// === FUNÇÃO DE LOG ===
async function registrarLog(message, conteudo, arquivos) {
  if (!LOG_CHANNEL_ID) return;
  const canalLog = await message.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (!canalLog) return;

  const horario = horaBrasilia();
  const embed = new EmbedBuilder()
    .setDescription(`**mensagem:** ${conteudo || "_(postagem sem descrição)_"}`)
    .setFooter({
      text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${horario}`
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

  const mentionedBot = message.mentions.has(client.user);
  const mentionedEveryone = message.mentions.everyone;
  const mentionedHere = message.content.includes("@here");

  // Detecta se é reply a mensagem da Leca
  let isReplyToLeca = false;
  let replyTo = null;
  if (message.reference) {
    replyTo = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (replyTo?.author?.id === client.user.id) isReplyToLeca = true;
  }

  // Verifica se o conteúdo menciona o bot explicitamente
  const contentMentionsBot =
    message.content.includes(`<@!${client.user.id}>`) ||
    message.content.includes(`<@${client.user.id}>`);

  // Regras de acionamento:
  // - Mensagem menciona o bot (sozinho ou com @everyone/@here)
  // - Reply à Leca que contém @leca
  if (!mentionedBot && !(isReplyToLeca && contentMentionsBot)) return;

  // Remove menção ao bot do conteúdo
  const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();

  // Anexos
  const files = Array.from(message.attachments.values()).map(
    a => new AttachmentBuilder(a.url, { name: a.name })
  );

  // Não repostar se não houver texto nem anexos
  if (!cleanContent && files.length === 0) return;

  // Deleta a mensagem original
  await message.delete().catch(() => {});

  // Cria embed apenas se houver texto
  const embed = cleanContent ? new EmbedBuilder().setDescription(cleanContent) : null;

  await message.channel.send({
    content: "sua mensagem foi escondida 💕",
    embeds: embed ? [embed] : undefined,
    files: files.length > 0 ? files : undefined,
    reply: replyTo ? { messageReference: replyTo.id } : undefined,
  });

  // Registra log
  await registrarLog(message, cleanContent, files);

  console.log(
    `[${horaBrasilia()}] Mensagem repostada anonimamente no canal ${message.channel.name}`
  );
}

// === EVENTO: NOVA MENSAGEM ===
client.on("messageCreate", repostarAnonimamente);

// === LOGIN ===
client.login(TOKEN).then(() => console.log("✅ Login bem-sucedido!"));