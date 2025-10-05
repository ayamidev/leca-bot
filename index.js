import { Client, GatewayIntentBits, Partials, EmbedBuilder, REST, Routes } from "discord.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

// --- Variáveis de ambiente ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("⚠️ TOKEN ou CLIENT_ID não definidos! Verifique o .env ou variáveis do Render.");
  process.exit(1);
}

console.log("✅ Variáveis de ambiente carregadas corretamente.");

// --- Variáveis de canal ---
let logChannelId = null;
let defaultLogChannelId = null;

// --- Inicialização do cliente ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel]
});

// --- Logs e servidor HTTP mínimo ---
client.on("error", console.error);
client.on("warn", console.warn);
client.on("debug", console.log);

const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot Leca está online! 💕"));
app.listen(port, () => console.log(`Servidor HTTP ativo na porta ${port}`));

function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false
  });
}

// --- Registro dinâmico dos comandos slash ---
const commands = [
  {
    name: "setlog",
    description: "Define o canal de log principal",
    options: [
      {
        name: "canal",
        description: "Canal para registrar logs",
        type: 7, // CHANNEL
        required: true
      }
    ]
  },
  {
    name: "set_defaultlog",
    description: "Define o canal de log secundário (monitoramento de mensagens deletadas)",
    options: [
      {
        name: "canal",
        description: "Canal para monitorar mensagens deletadas",
        type: 7,
        required: true
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registrarComandos() {
  try {
    console.log("📦 Registrando comandos...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
}

// --- Evento ready ---
client.once("ready", async () => {
  console.log(`✅ Logado como ${client.user.tag}`);
  await registrarComandos();
});

// --- Comandos /setlog e /set_defaultlog ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const canal = interaction.options.getChannel("canal");
  if (!canal) {
    await interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });
    return;
  }

  if (interaction.commandName === "setlog") {
    logChannelId = canal.id;
    await interaction.reply({
      content: `Canal de log definido com sucesso para ${canal}!`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "set_defaultlog") {
    defaultLogChannelId = canal.id;
    await interaction.reply({
      content: `Canal de log secundário definido com sucesso para ${canal}!`,
      ephemeral: true
    });
  }
});

// --- Função para baixar anexos via fetch ---
async function baixarAnexos(message) {
  const arquivos = [];
  for (const [, a] of message.attachments) {
    const response = await fetch(a.url);
    const arrayBuffer = await response.arrayBuffer();
    arquivos.push({ attachment: Buffer.from(arrayBuffer), name: a.name });
  }
  return arquivos;
}

// --- Repost anônimo com +leca e preservando replies ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith("+leca")) return;

  const cleanContent = message.content.slice(5).trim();
  const files = await baixarAnexos(message);

  if (!cleanContent && files.length === 0) return;

  let referenceId = undefined;
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (refMsg) referenceId = refMsg.id;
  }

  await message.delete().catch(() => {});

  const sendData = {
    content: "sua mensagem foi escondida 💕",
    embeds: cleanContent ? [new EmbedBuilder().setDescription(cleanContent)] : undefined,
    files: files.length > 0 ? files : undefined,
    messageReference: referenceId ? { message_id: referenceId } : undefined
  };

  await message.channel.send(sendData);

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
        files: files.length > 0 ? files : undefined,
        messageReference: referenceId ? { message_id: referenceId } : undefined
      });
    }
  }
});

// --- Monitoramento quando a Leca apaga mensagens ---
client.on("messageDelete", async (deletedMessage) => {
  try {
    if (deletedMessage.client.user.id !== client.user.id) return;
    if (!defaultLogChannelId) return;

    const monitorChannel = deletedMessage.guild.channels.cache.get(defaultLogChannelId);
    if (!monitorChannel) return;

    const collector = monitorChannel.createMessageCollector({
      filter: msg => {
        if (msg.author.bot && msg.author.id !== client.user.id) return false;

        const inContent = msg.content && msg.content.includes("Mensagem de texto deletada");

        const inEmbeds = msg.embeds?.some(e =>
          (e.title && e.title.includes("Mensagem de texto deletada")) ||
          (e.description && e.description.includes("Mensagem de texto deletada")) ||
          (e.fields && e.fields.some(f =>
            f.name.includes("Mensagem de texto deletada") ||
            f.value.includes("Mensagem de texto deletada")
          ))
        );

        return inContent || inEmbeds;
      },
      time: 15000,
      max: 1
    });

    collector.on("collect", async (msg) => {
      await msg.delete().catch(() => {});
      console.log(`🧹 Aviso de exclusão removido automaticamente em #${monitorChannel.name}`);
    });

  } catch (err) {
    console.error("Erro ao monitorar exclusão:", err);
  }
});

client.login(TOKEN)
  .then(() => console.log("🔑 Tentativa de login enviada ao Discord..."))
  .catch(err => console.error("❌ Falha ao logar no Discord:", err));
