// index.js
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials,
} from "discord.js";
import express from "express";

// === CONFIGURAÇÃO DO SERVIDOR WEB (para manter online) ===
const app = express();
app.get("/", (req, res) => res.send("Leca está viva 💫"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Web service ativo!"));

// === CONFIGURAÇÃO DO CLIENTE DISCORD ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const TOKEN = process.env.TOKEN;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID; // canal de log

// === FUNÇÃO DE FORMATAÇÃO DE DATA/HORA ===
function formatarHorarioBrasilia() {
  const agora = new Date();
  const opcoes = {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  return agora.toLocaleString("pt-BR", opcoes);
}

// === FUNÇÃO DE LOG ===
async function registrarLog(message, conteudo, arquivos) {
  const canalLog = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (!canalLog) return;

  const horario = formatarHorarioBrasilia();

  const embed = new EmbedBuilder()
    .setTitle("📨 Mensagem Anônima Enviada")
    .setColor("#9b59b6")
    .addFields(
      { name: "👤 Autor", value: `${message.author.tag}`, inline: false },
      { name: "🕒 Horário", value: horario, inline: true },
      {
        name: "💬 Conteúdo",
        value: conteudo || "(sem texto)",
        inline: false,
      }
    )
    .setFooter({ text: `Canal: #${message.channel.name}` })
    .setTimestamp();

  await canalLog.send({
    embeds: [embed],
    files: arquivos.length > 0 ? arquivos : undefined,
  });
}

// === FUNÇÃO PRINCIPAL DE REPOSTAGEM ANÔNIMA ===
async function repostarAnonimamente(message) {
  if (message.author.bot) return;

  // Detecta menções
  const mentionedBot = message.mentions.has(client.user);
  const mentionedEveryone = message.mentions.everyone;
  const mentionedHere = message.content.includes("@here");

  // Só processa se o bot foi mencionado
  if (!mentionedBot) return;

  // Ignora mensagens que mencionam apenas @everyone ou @here sem o bot
  if (!mentionedBot && (mentionedEveryone || mentionedHere)) return;

  // Remove apenas a menção ao bot (mantém outras menções)
  const cleanContent = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();

  const files = message.attachments.map((a) => a.url);
  const apenasMencaoSemAnexo = mentionedBot && !cleanContent && files.length === 0;
  if (apenasMencaoSemAnexo) return;

  // Captura mensagem respondida, se existir
  let replyTo = null;
  if (message.reference) {
    replyTo = await message.channel.messages
      .fetch(message.reference.messageId)
      .catch(() => null);
  }

  // Remove a mensagem original
  await message.delete().catch(() => {});

  // Cria embed, se houver texto
  const embed = cleanContent
    ? new EmbedBuilder().setDescription(cleanContent).setColor("#dcd6f7")
    : null;

  // Envia a mensagem anônima
  await message.channel.send({
    embeds: embed ? [embed] : undefined,
    files: files.length > 0 ? files : undefined,
    reply: replyTo ? { messageReference: replyTo.id } : undefined,
  });

  // Loga o envio
  await registrarLog(message, cleanContent, files);
}

// === EVENTOS DO CLIENTE ===
client.on("ready", () => {
  console.log(`🤖 Leca conectada como ${client.user.tag}`);
});

client.on("messageCreate", repostarAnonimamente);

// === LOGIN ===
client.login(TOKEN);
