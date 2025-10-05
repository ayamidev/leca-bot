import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

// === CONFIGURAÇÃO DO CLIENT ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
let LOG_CHANNEL_ID = null;

// === WEBSERVER PARA MANTER ONLINE ===
const app = express();
app.get("/", (_, res) => res.send("💖 Leca está online!"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Servidor HTTP ativo!"));

// === FUNÇÃO DE HORÁRIO ===
function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });
}

// === REGISTRO AUTOMÁTICO DO COMANDO /setlog ===
async function registrarComandos() {
  const commands = [
    new SlashCommandBuilder()
      .setName("setlog")
      .setDescription("Define o canal atual como canal de logs."),
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("🔄 Registrando comandos...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.error("Erro ao registrar comandos:", err);
  }
}

// === EVENTO DE INICIALIZAÇÃO ===
client.once("ready", async () => {
  console.log(`🤖 Leca conectada como ${client.user.tag}`);
  await registrarComandos();
  console.log(
    `Servidores: ${client.guilds.cache.map((g) => g.name).join(", ")}`
  );
});

// === INTERAÇÃO: /setlog ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "setlog") {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ Você não tem permissão para definir o canal de log!",
        ephemeral: true,
      });
    }

    LOG_CHANNEL_ID = interaction.channel.id;
    await interaction.reply({
      content: "✅ Canal de log definido com sucesso!",
      ephemeral: true,
    });
  }
});

// === FUNÇÃO DE LOG ===
async function registrarLog(message, conteudo, arquivos) {
  if (!LOG_CHANNEL_ID) return;
  const canalLog = await message.guild.channels
    .fetch(LOG_CHANNEL_ID)
    .catch(() => null);
  if (!canalLog) return;

  const horario = horaBrasilia();
  const embed = new EmbedBuilder()
    .setColor("LuminousVividPink")
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

// === REPOSTAGEM ANÔNIMA ===
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const mentionedBot = message.mentions.has(client.user);
  const mentionedEveryone = message.mentions.everyone;
  const mentionedHere = message.content.includes("@here");

  // Ignora @everyone e @here sozinhos
  if ((mentionedEveryone || mentionedHere) && !mentionedBot) return;

  // Ignora respostas à Leca que não mencionam ela explicitamente
  if (message.reference && !mentionedBot) {
    const repliedTo = await message.channel.messages
      .fetch(message.reference.messageId)
      .catch(() => null);
    if (repliedTo && repliedTo.author.id === client.user.id) return;
  }

  // Só continua se mencionou a Leca
  if (!mentionedBot) return;

  const cleanContent = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();
  const files = message.attachments.map((a) => a.url);
  if (!cleanContent && files.length === 0) return;

  let replyTo = null;
  if (message.reference) {
    replyTo = await message.channel.messages
      .fetch(message.reference.messageId)
      .catch(() => null);
  }

  await message.delete().catch(() => {});

  const embed = new EmbedBuilder()
    .setColor("LuminousVividPink")
    .setDescription(cleanContent || "_(mensagem sem texto)_")
    .setFooter({ text: "💬 Sua mensagem foi escondida 💕" });

  await message.channel.send({
    embeds: [embed],
    files: files.length > 0 ? files : undefined,
    reply: replyTo ? { messageReference: replyTo.id } : undefined,
  });

  await registrarLog(message, cleanContent, files);
});

// === LOGIN ===
client.login(TOKEN);