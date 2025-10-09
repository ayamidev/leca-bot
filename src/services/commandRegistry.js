import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "../config.js";

export async function registerCommands(client, specificGuildId = null) {
  const commands = [
    new SlashCommandBuilder()
      .setName("setlog")
      .setDescription("Define o canal de logs do servidor")
      .addChannelOption(opt => opt.setName("canal").setDescription("Canal de logs").setRequired(true))
      .toJSON(),

    new SlashCommandBuilder()
      .setName("set_defaultlog")
      .setDescription("Define o canal de logs padrão")
      .addChannelOption(opt => opt.setName("canal").setDescription("Canal de logs").setRequired(true))
      .toJSON(),

    new SlashCommandBuilder()
      .setName("leca")
      .setDescription("Envia uma mensagem como se fosse a Leca")
      .addStringOption(opt => opt.setName("mensagem").setDescription("Conteúdo da mensagem").setRequired(true))
      .toJSON(),

    new SlashCommandBuilder()
      .setName("purge")
      .setDescription("Gerencia a exclusão de mensagens sem mídia")
      .addSubcommand(sub => sub.setName("papinhos").setDescription("Exclui X mensagens sem mídia")
        .addIntegerOption(opt => opt.setName("quantidade").setDescription("Número de mensagens").setRequired(true)))
      .addSubcommand(sub => sub.setName("all_papinhos").setDescription("Exclui todas as mensagens sem mídia"))
      .toJSON(),

    new SlashCommandBuilder()
      .setName("dindin")
      .setDescription("Gerencia moedas do servidor")
      .addSubcommand(sub => sub.setName("nome")
        .setDescription("Define o nome da moeda")
        .addStringOption(opt => opt.setName("nome").setDescription("Nome da moeda").setRequired(true)))
      .addSubcommand(sub => sub.setName("adicionar")
        .setDescription("Adiciona moedas a um usuário")
        .addUserOption(opt => opt.setName("usuario").setDescription("Usuário").setRequired(true))
        .addIntegerOption(opt => opt.setName("quantidade").setDescription("Quantidade").setRequired(true)))
      .addSubcommand(sub => sub.setName("retirar")
        .setDescription("Retira moedas de um usuário")
        .addUserOption(opt => opt.setName("usuario").setDescription("Usuário").setRequired(true))
        .addIntegerOption(opt => opt.setName("quantidade").setDescription("Quantidade").setRequired(true)))
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(config.TOKEN);

  try {
    if (specificGuildId) {
      // Registro em guilda específica
      await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, specificGuildId), { body: commands });
      console.log(`✅ Comandos registrados em guilda ${specificGuildId}`);
    } else {
      // Registro em todas as guildas do cache
      for (const [guildId] of client.guilds.cache) {
        await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { body: commands });
        console.log(`✅ Comandos registrados em guilda ${guildId}`);
      }
    }
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
}
