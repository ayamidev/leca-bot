import Discord from "discord.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField, REST, Routes, SlashCommandBuilder } = Discord;

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let LOG_CHANNEL_ID = null;

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

// === REGISTRA COMANDO /setlog AUTOMATICAMENTE ===
client.once("ready", async () => {
  console.log(`✅ Login bem-sucedido!`);
  console.log(`🤖 Leca conectada como ${client.user.tag}`);
  console.log(`Servidores: ${client.guilds.cache.map(g => g.name).join(", ")}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("setlog")
      .setDescription("Define o canal atual como o canal de logs.")
      .toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("💾 Comando /setlog registrado com sucesso!");
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);
  }
});

// === TRATA O COMANDO /setlog ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "setlog") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Você não tem permissão para definir o canal de log!", ephemeral: true });
    }
    LOG_CHANNEL_ID = interaction.channel.id;
    await interaction.reply({ content: "✅ Canal de log definido com sucesso!", ephemeral: true });
  }
});

// === FUNÇÃO DE LOG ===
async function registrarLog(message, conteudo, arquivos) {
  if (!LOG_CHANNEL_ID) return;
  const canalLog = await message.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (!canalLog) return;

  const horario = horaBrasilia();
  const embed = new EmbedBuilder()
    .setDescription(`**mensagem:** ${conteudo || "_(postagem sem descrição)_"}`)
    .setFooter({ text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${horario}` });

  await canalLog.send({
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

  // Ignora mensagens que não mencionam o bot
  if (!mentionedBot) return;

  // Ignora mensagens que são só @everyone ou @here
  if (!mentionedBot && (mentionedEveryone || mentionedHere)) return;

  // Se for resposta à Leca, só reage se tiver @leca no texto
  if (message.reference) {
    const replied = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (replied && replied.author.id === client.user.id && !mentionedBot) return;
  }

  const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();
  const files = message.attachments.map(a => a.url);
  if (!cleanContent && files.length === 0) return;

  await message.delete().catch(() => {});
  const options = {
    content: cleanContent || undefined,
    files: files.length > 0 ? files : undefined,
  };

  await message.channel.send(options);
  await registrarLog(message, cleanContent, files);
}

client.on("messageCreate", repostarAnonimamente);
client.login(TOKEN);