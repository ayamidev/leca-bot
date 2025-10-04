require('dotenv').config();
const { Client, GatewayIntentBits, Partials, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");

// ===== CONFIGURAÇÕES =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ===== ARQUIVO DE CONFIGURAÇÃO =====
const CONFIG_FILE = "./config.json";
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

// ===== CLIENTE =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ===== DEFINIÇÃO DO COMANDO /setlog =====
const commands = [
  new SlashCommandBuilder()
    .setName("setlog")
    .setDescription("Define o canal de logs de mensagens anônimas")
    .addChannelOption(option =>
      option.setName("canal")
        .setDescription("Canal onde os logs serão enviados")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

// ===== REGISTRO AUTOMÁTICO DE COMANDOS EM NOVOS SERVIDORES =====
client.on("guildCreate", async (guild) => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: commands });
    console.log(`✅ Comandos registrados em: ${guild.name}`);
  } catch (err) {
    console.error(err);
  }
});

// ===== BOT ONLINE =====
client.once("clientReady", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// ===== EXECUÇÃO DO /setlog =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setlog") {
    const canal = interaction.options.getChannel("canal");
    config[interaction.guild.id] = canal.id;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    await interaction.reply({
      content: `📌 Canal de logs definido para ${canal}`,
      ephemeral: true
    });
  }
});

// ===== ANON POST =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  // Remove a menção do bot
  const cleanContent = message.content.replace(/<@!?(\d+)>/, "").trim();

  // Pega os anexos
  const files = Array.from(message.attachments.values()).map(att => ({
    attachment: att.url,
    name: att.name
  }));

  // ===== REPOST NO CANAL ORIGINAL =====
  if (cleanContent || files.length > 0) {
    const embed = cleanContent ? { description: cleanContent } : undefined;

    await message.channel.send({
      content: "Sua mensagem foi escondida 💕",
      embeds: embed ? [embed] : undefined,
      files: files.length > 0 ? files : undefined
    });

    await message.delete();
  }

  // ===== LOG NO CANAL DEFINIDO =====
  const logChannelId = config[message.guild.id];
  if (logChannelId) {
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      // Mensagem de registro
      await logChannel.send("Registro de Auditoria 💕");

      // Descrição do embed no log
      const logDescription = cleanContent ? `**mensagem:** ${cleanContent}` : "*(postagem sem descrição)*";

      await logChannel.send({
        embeds: [{
          description: logDescription,
          footer: {
            text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${new Date().toLocaleString()}`
          }
        }],
        files: files.length > 0 ? files : undefined
      });
    }
  }
});

client.login(TOKEN);
