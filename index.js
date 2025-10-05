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
        type: 7,
        required: true
      }
    ]
  },
  {
    name: "set_defaultlog",
    description: "Define o canal de log secundário (monitoramento contínuo de mensagens com +leca)",
    options: [
      {
        name: "canal",
        description: "Canal para monitorar mensagens com +leca",
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

  // Preservar reply se existir
  let replyOptions = {};
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (refMsg) {
      replyOptions = { reply: { messageReference: refMsg.id, failIfNotExists: false } };
    }
  }

  await message.delete().catch(() => {});

  const sendData = {
    content: "sua mensagem foi escondida 💕",
    embeds: cleanContent ? [new EmbedBuilder().setDescription(cleanContent)] : undefined,
    files: files.length > 0 ? files : undefined,
    ...replyOptions
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
        ...replyOptions
      });
    }
  }
});

// --- Função robusta para detectar +leca em embeds ---
function embedContemLeca(embed) {
  const partes = [];

  if (embed.title) partes.push(embed.title);
  if (embed.description) partes.push(embed.description);
  if (embed.fields) {
    embed.fields.forEach(f => {
      if (f.name) partes.push(f.name);
      if (f.value) partes.push(f.value);
    });
  }

  // Normaliza texto: remove backticks e quebras de linha, verifica +leca
  return partes.some(text =>
    text.replace(/[`]/g, '').replace(/\s+/g, ' ').toLowerCase().includes("+leca")
  );
}

// --- Monitoramento contínuo do canal de log secundário ---
client.on("messageCreate", async (message) => {
  if (!defaultLogChannelId) return;
  if (!message.guild) return;
  if (message.channel.id !== defaultLogChannelId) return;

  // Ignora mensagens da própria Leca
  if (message.author.id === client.user.id) return;

  // Debug: loga todas as mensagens recebidas no canal de monitoramento
  console.log(`[DEBUG] Mensagem recebida em #${message.channel.name} por ${message.author.tag}:`, message.content);

  const inContent = message.content && message.content.toLowerCase().includes("+leca");
  const inEmbeds = message.embeds?.some(embedContemLeca);

  if (inContent || inEmbeds) {
    await message.delete().catch(() => {});
    console.log(`🧹 Mensagem com +leca removida automaticamente em #${message.channel.name}`);
  }
});

client.login(TOKEN)
  .then(() => console.log("🔑 Tentativa de login enviada ao Discord..."))
  .catch(err => console.error("❌ Falha ao logar no Discord:", err));
