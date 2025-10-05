import Discord from "discord.js";
import express from "express";
import dotenv from "dotenv";

const { Client, GatewayIntentBits, Partials, MessageEmbed } = Discord;
dotenv.config();

// === VARIÁVEIS ===
const TOKEN = process.env.TOKEN;
let LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// === CLIENTE DISCORD ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // ESSENCIAL
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// === WEBSERVER PARA MANTER ONLINE ===
const app = express();
app.get("/", (_, res) => res.send("💖 Leca está online!"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Servidor HTTP ativo!")
);

// === HORÁRIO BRASIL ===
function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });
}

// === LOGIN E DEBUG ===
client.once("ready", () => {
  console.log(`🤖 Leca conectada como ${client.user.tag}`);
  console.log(
    `Servidores: ${client.guilds.cache.map((g) => g.name).join(", ")}`
  );
  if (!client.guilds.cache.size) {
    console.warn("⚠️ Leca não está em nenhum servidor!");
  }
});

// === COMANDO SIMPLES !setlog ===
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!setlog")) return;
  if (!message.member || !message.member.permissions.has("Administrator"))
    return;

  LOG_CHANNEL_ID = message.channel.id;
  message.reply("Canal de log definido com sucesso!");
});

// === FUNÇÃO DE LOG ===
async function registrarLog(message, conteudo, arquivos) {
  if (!LOG_CHANNEL_ID) return;
  const canalLog = await message.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (!canalLog) return;

  const horario = horaBrasilia();
  const embed = new MessageEmbed()
    .setDescription(`**mensagem:** ${conteudo || "_(postagem sem descrição)_"}`)
    .setFooter(
      `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${horario}`
    );

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

  if (!mentionedBot) return;
  if (!mentionedBot && (mentionedEveryone || mentionedHere)) return;

  const cleanContent = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();

  const files = Array.from(message.attachments.values()).map((a) => a.url);

  // Caso não tenha texto nem anexos, não repostar
  if (!cleanContent && files.length === 0) return;

  let replyTo = null;
  if (message.reference) {
    replyTo = await message.channel.messages
      .fetch(message.reference.messageId)
      .catch(() => null);
  }

  await message.delete().catch(() => {});

  const embed = cleanContent ? new MessageEmbed().setDescription(cleanContent) : null;

  await message.channel.send({
    content: "sua mensagem foi escondida 💕",
    embeds: embed ? [embed] : undefined,
    files: files.length > 0 ? files : undefined,
    reply: replyTo ? { messageReference: replyTo.id } : undefined,
  });

  await registrarLog(message, cleanContent, files);
}

// === EVENTO: NOVA MENSAGEM ===
client.on("messageCreate", repostarAnonimamente);

// === LOGIN ===
client.login(TOKEN).catch((err) => {
  console.error("❌ Erro ao logar no Discord:", err);
});
