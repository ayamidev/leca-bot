const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
let logChannelId = null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel]
});

// Quando o bot estiver pronto
client.once("clientReady", () => {
  console.log(`✅ Logada como ${client.user.tag}`);
});

// Função pra converter a hora pro fuso de Brasília
function horaBrasilia() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false
  });
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "setlog") {
    logChannelId = interaction.channel.id;
    await interaction.reply({
      content: "Canal de log definido com sucesso!",
      ephemeral: true // corrigido: substitui o antigo InteractionResponseFlags
    });
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ignora se a mensagem for uma resposta a outra (pra não esconder replies)
  if (message.reference) return;

  // limpa o conteúdo removendo @Leca
  const cleanContent = message.content.replace(/<@!?(\d+)>/g, "").trim();

  // pega anexos
  const files = message.attachments.map(a => a.url);

  // caso 1: mensagem só tem @bot e anexos
  const apenasMencaoEAnexo =
    message.mentions.has(client.user) && !cleanContent && files.length > 0;

  // caso 2: mensagem só tem @bot e nenhum anexo → ignora
  const apenasMencaoSemAnexo =
    message.mentions.has(client.user) && !cleanContent && files.length === 0;

  if (apenasMencaoSemAnexo) return;

  // se a mensagem mencionar o bot, repostar como anônima
  if (message.mentions.has(client.user)) {
    await message.delete().catch(() => {});

    // se tiver texto, usa embed
    if (cleanContent) {
      const embed = new EmbedBuilder().setDescription(cleanContent);
      await message.channel.send({
        content: "sua mensagem foi escondida 💕",
        embeds: [embed],
        files: files.length > 0 ? files : undefined
      });
    } else {
      // se não tiver texto, apenas repostar os anexos
      await message.channel.send({
        content: "sua mensagem foi escondida 💕",
        files
      });
    }

    // envia registro no canal de log
    if (logChannelId) {
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const descricao =
          cleanContent || "* (postagem sem descrição)*";

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

client.login(TOKEN);