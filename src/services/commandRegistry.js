import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "../config.js";

export async function registerCommands(client) {
  const rest = new REST({ version: "10" }).setToken(config.TOKEN);

  const commands = [
    new SlashCommandBuilder()
      .setName("configurar")
      .setDescription("Gerencia permissões de comandos + por canal ou cargo")
      .toJSON(),

    new SlashCommandBuilder()
      .setName("setlog")
      .setDescription("Define o canal de log a ser usado pela Leca")
      .addChannelOption(opt =>
        opt.setName("canal")
          .setDescription("Canal de log")
          .setRequired(true)
      )
      .toJSON(),

    new SlashCommandBuilder()
      .setName("set_defaultlog")
      .setDescription("Define o canal de log padrão")
      .addChannelOption(opt =>
        opt.setName("canal")
          .setDescription("Canal de log")
          .setRequired(true)
      )
      .toJSON(),

    new SlashCommandBuilder()
      .setName("leca")
      .setDescription("A Leca envia uma mensagem como se fosse ela mesma")
      .addStringOption(opt =>
        opt.setName("mensagem")
          .setDescription("Conteúdo da mensagem")
          .setRequired(true)
      )
      .addAttachmentOption(opt =>
        opt.setName("anexos")
          .setDescription("Arquivos a serem enviados junto (opcional)")
          .setRequired(false)
      )
      .toJSON(),

    new SlashCommandBuilder()
      .setName("purge")
      .setDescription("Gerencia exclusão de mensagens")
      .addSubcommand(sub => sub
        .setName("papinhos")
        .setDescription("Excluir X mensagens sem mídia")
        .addIntegerOption(opt =>
          opt.setName("quantidade")
            .setDescription("Número de mensagens")
            .setRequired(true)
        )
      )
      .addSubcommand(sub => sub
        .setName("all_papinhos")
        .setDescription("Excluir todas as mensagens sem mídia")
      )
      .toJSON(),

    new SlashCommandBuilder()
      .setName("dindin")
      .setDescription("Gerencia moedas do servidor")
      .addSubcommand(sub => sub
        .setName("nome")
        .setDescription("Define o nome da moeda")
        .addStringOption(opt =>
          opt.setName("nome")
            .setDescription("Nome da moeda")
            .setRequired(true)
        )
      )
      .addSubcommand(sub => sub
        .setName("adicionar")
        .setDescription("Adiciona moedas a um usuário")
        .addUserOption(opt =>
          opt.setName("usuario")
            .setDescription("Usuário")
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName("quantidade")
            .setDescription("Quantidade")
            .setRequired(true)
        )
      )
      .addSubcommand(sub => sub
        .setName("retirar")
        .setDescription("Retira moedas de um usuário")
        .addUserOption(opt =>
          opt.setName("usuario")
            .setDescription("Usuário")
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName("quantidade")
            .setDescription("Quantidade")
            .setRequired(true)
        )
      )
      .toJSON()
  ];

  try {
    // Registrar comandos globais (substitui todos)
    // await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });
    // console.log("✅ Comandos globais registrados com sucesso");

    // Registrar comandos em todas as guildas
    for (const [guildId] of client.guilds.cache) {
      await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { body: commands });
      console.log(`✅ Comandos registrados na guilda ${guildId}`);
    }

  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
}
