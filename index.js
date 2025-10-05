import Discord from "discord.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const { Client, GatewayIntentBits, Partials, MessageEmbed } = Discord;
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

// === EVENTO: NOVA MENSAGEM (EXEMPLO) ===
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const mentionedBot = message.mentions.has(client.user);
  if (!mentionedBot) return;

  const cleanContent = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();

  const files = Array.from(message.attachments.values()).map((a) => a.url);

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

  console.log(
    `[${horaBrasilia()}] Mensagem repostada anonimamente no canal ${message.channel.name}`
  );
});

// === LOGIN ===
client
  .login(TOKEN)
  .then(() => console.log("✅ Login bem-sucedido!"))
  .catch((err) => console.error("❌ Falha ao logar:", err));
