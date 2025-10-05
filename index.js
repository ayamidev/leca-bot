// index.js
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials,
} from "discord.js";
import express from "express";

// === CONFIGURAÇÃO DO SERVIDOR WEB (Render Uptime) ===
const app = express();
app.get("/", (_, res) => res.send("Leca está viva 💫"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Web service ativo!")
);

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
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// === FUNÇÃO DE FORMATAÇÃO DE DATA/HORA ===
function formatarHorarioBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });
}

// === FUNÇÃO DE LOG ===
async function registrarLog(message, conteudo, arquivos) {
  const canalLog = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (!canalLog) {
    console.log("⚠️ Canal de log não encontrado ou não definido.");
    return;
  }

  const horario = formatarHorarioBrasilia();

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

// === FUNÇÃO PRINCIPAL DE REPOSTAGEM ANÔNIMA ===
async function repostarAnonimamente(message) {
  try {
    if (message.author.bot) return;

    console.log("📥 Nova mensagem detectada:", message.content);

    // Detecta menções
    const mentionedBot = message.mentions.has(client.user);
    const mentionedEveryone = message.mentions.everyone;
    const mentionedHere = message.content.includes("@here");

    console.log("👥 Menções detectadas:", {
      bot: mentionedBot,
      everyone: mentionedEveryone,
      here: mentionedHere,
    });

    // Só processa se o bot foi mencionado
    if (!mentionedBot) return;

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
    await message.delete().catch(() => {
      console.log("⚠️ Falha ao deletar mensagem original");
    });

    // Cria embed, se houver texto
    const embed = cleanContent
      ? new EmbedBuilder().setDescription(cleanContent).setColor("#dcd6f7")
      : null;

    // Envia a mensagem anônima
    await message.channel.send({
      content: "sua mensagem foi escondida 💕",
      embeds: embed ? [embed] : undefined,
      files: files.length > 0 ? files : undefined,
      reply: replyTo ? { messageReference: replyTo.id } : undefined,
    });

    // Loga o envio
    await registrarLog(message, cleanContent, files);

    console.log("✅ Mensagem repostada anonimamente com sucesso");
  } catch (err) {
    console.error("❌ Erro no repost anônimo:", err);
  }
}

// === EVENTOS DO CLIENTE ===
client.on("clientReady", () => {
  console.log(`🤖 Leca conectada como ${client.user.tag}`);
});

client.on("messageCreate", repostarAnonimamente);

// === LOGIN ===
client.login(TOKEN);
