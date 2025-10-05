import { Client, GatewayIntentBits, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder } from "discord.js";
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

let logChannelId = null;

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

// --- Função para registrar comandos dinamicamente ---
async function registrarComandos() {
  const commands = [
    new SlashCommandBuilder()
      .setName("setlog")
      .setDescription("Define o canal de log do bot")
      .addChannelOption(option =>
        option.setName("canal")
              .setDescription("Escolha o canal de log")
              .setRequired(true)
      )
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("🔄 Registrando comandos slash globalmente...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
}

// --- Evento ready ---
client.once("ready", async () => {
  console.log(`✅ Logado como ${client.user.tag}`);
  await registrarComandos(); // registra comandos no boot
});

// --- Slash command /setlog ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "setlog") {
    const canal = interaction.options.getChannel("canal");
    if (!canal) {
      await interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });
      return;
    }

    logChannelId = canal.id;
    await interaction.reply({
      content: `Canal de log definido com sucesso para ${canal}!`,
      ephemeral: true
    });
  }
});

// --- Função para baixar anexos via fetch nativo ---
async function baixarAnexos(message) {
  return Promise.all(
    message.attachments.map(async a => {
      const response = await fetch(a.url);
      const arrayBuffer = await response.arrayBuffer();
      return { attachment: Buffer.from(arrayBuffer), name: a.name };
    })
  );
}

// --- Repost anônimo com +leca e preservando replies ---
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Mensagens que não começam com +leca são ignoradas
  if (!message.content.toLowerCase().startsWith("+leca")) return;

  const cleanContent = message.content.slice(5).trim(); // remove +leca
  const files = await baixarAnexos(message);

  if (!cleanContent && files.length === 0) return;

  // Preserva referência se for reply
  let referenceId = undefined;
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (refMsg) {
      referenceId = refMsg.id; // ID da mensagem original que será usada em messageReference
    }
  }

  // Deleta mensagem original
  await message.delete().catch(() => {});

  // Prepara envio
  const sendData = {
    content: "sua mensagem foi escondida 💕",
    embeds: cleanContent ? [new EmbedBuilder().setDescription(cleanContent)] : undefined,
    files: files.length > 0 ? files : undefined,
    reply: referenceId ? { messageReference: referenceId } : undefined
  };

  const sentMessage = await message.channel.send(sendData);

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

      const logData = {
        content: "Registro de Auditoria 💕",
        embeds: [embed],
        files: files.length > 0 ? files : undefined,
        reply: referenceId ? { messageReference: referenceId } : undefined
      };

      await logChannel.send(logData);
    }
  }
});

client.login(TOKEN)
  .then(() => console.log("🔑 Tentativa de login enviada ao Discord..."))
  .catch(err => console.error("❌ Falha ao logar no Discord:", err));