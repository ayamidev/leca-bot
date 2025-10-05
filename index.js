import { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder } from "discord.js";
import express from "express";

// --- Variáveis de ambiente ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
  console.error("⚠️ TOKEN não definido! Verifique as variáveis de ambiente.");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error("⚠️ CLIENT_ID não definido! Verifique as variáveis de ambiente.");
  process.exit(1);
}

console.log("✅ Variáveis de ambiente carregadas corretamente.");

// --- Cliente Discord ---
let logChannelId = null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel]
});

// --- Logs de debug e erros ---
client.on("error", err => console.error("❌ Evento de erro:", err));
client.on("warn", warn => console.warn("⚠️ Aviso:", warn));
client.on("debug", info => console.log("ℹ️ Debug:", info)); // opcional, muito verboso

// --- Servidor HTTP mínimo para Render ---
const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot Leca está online! 💕"));
app.listen(port, () => console.log(`Servidor HTTP ativo na porta ${port}`));

// --- Função para horário de Brasília ---
function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false
  });
}

// --- Evento ready ---
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

// --- Repost anônimo com anexos ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.reference) {
    const ref = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (ref && ref.author.id === client.user.id) return;
  }

  const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();
  const files = message.attachments.map(a => new AttachmentBuilder(a.url, { name: a.name }));

  const apenasMencaoEAnexo =
    message.mentions.has(client.user) && !cleanContent && files.length > 0;
  const apenasMencaoSemAnexo =
    message.mentions.has(client.user) && !cleanContent && files.length === 0;

  if (apenasMencaoSemAnexo) return;

  if (message.mentions.has(client.user)) {
    await message.delete().catch(() => {});

    // Repost da mensagem
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

    // Registro no canal de log
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
  }
});

// --- Login com catch de erros ---
client.login(TOKEN)
  .then(() => console.log("🔑 Tentativa de login enviada ao Discord..."))
  .catch(err => console.error("❌ Falha ao logar no Discord:", err));
