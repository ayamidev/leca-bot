import Discord from "discord.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const { Client, GatewayIntentBits, Partials, EmbedBuilder } = Discord;

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || "N/A";

console.log("TOKEN:", TOKEN);
console.log("CLIENT_ID:", CLIENT_ID);

// === CLIENTE DISCORD ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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
let LOG_CHANNEL_ID = null; // será definido via comando
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!setlog")) return;
  if (!message.member || !message.member.permissions.has("Administrator"))
    return;

  LOG_CHANNEL_ID = message.channel.id;
  await message.reply({ content: "Canal de log definido com sucesso!" });
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
      text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${horario}`,
    });

  await canalLog.send({
    content: "Registro de Auditoria 💕",
    embeds: [embed],
    files: arquivos.length > 0 ? arquivos : undefined,
  });
}

// === FUNÇÃO DE REPOST ANONIMO ===
async function repostarAnonimamente(message) {
  if (message.author.bot) return;

  // Detecta menção ao bot e @everyone/@here
  const mentionedBot = message.mentions.has(client.user);
  const mentionedEveryone = message.mentions.everyone;
  const mentionedHere = message.content.includes("@here");

  // Só processa se mencionou o bot, sozinho ou junto de everyone/here
  if (!mentionedBot && !(mentionedBot && (mentionedEveryone || mentionedHere))) return;

  // Remove menção ao bot do conteúdo
  const cleanContent = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();

  // Pega anexos
  const files = Array.from(message.attachments.values()).map(a => a.url);

  // Caso não tenha nem texto nem anexos, não repostar
  if (!cleanContent && files.length === 0) return;

  // Detecta se é reply a outra mensagem
  let replyTo = null;
  if (message.reference) {
    replyTo = await message.channel.messages
      .fetch(message.reference.messageId)
      .catch(() => null);
  }

  // Deleta a mensagem original
  await message.delete().catch(() => {});

  // Cria embed apenas se tiver texto
  const embed = cleanContent ? new EmbedBuilder().setDescription(cleanContent) : null;

  // Reposta no canal original
  await message.channel.send({
    content: "sua mensagem foi escondida 💕",
    embeds: embed ? [embed] : undefined,
    files: files.length > 0 ? files : undefined,
    reply: replyTo ? { messageReference: replyTo.id } : undefined,
  });

  // Registra log (se LOG_CHANNEL_ID definido)
  await registrarLog(message, cleanContent, files);

  console.log(
    `[${horaBrasilia()}] Mensagem repostada anonimamente no canal ${message.channel.name}`
  );
}

// === EVENTO: NOVA MENSAGEM ===
client.on("messageCreate", repostarAnonimamente);

// === LOGIN ===
client
  .login(TOKEN)
  .then(() => console.log("✅ Login bem-sucedido!"))
  .catch((err) => console.error("❌ Falha ao logar:", err));