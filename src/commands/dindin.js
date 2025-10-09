import { Server } from "../models/server.js";
import { User } from "../models/user.js";

export async function handleDindin(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Apenas administradores podem usar este comando.", ephemeral: true });
  }

  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;

  if (subcommand === "nome") {
    const nome = interaction.options.getString("nome");
    const server = await Server.findOneAndUpdate(
      { guildId },
      { $set: { moedaNome: nome } },
      { upsert: true, new: true }
    );
    return interaction.reply({ content: `✅ Nome da moeda atualizado para **${nome}**.`, ephemeral: true });
  }

  const targetUser = interaction.options.getUser("usuario");
  const quantidade = interaction.options.getInteger("quantidade");

  if (!targetUser || quantidade == null) {
    return interaction.reply({ content: "❌ Usuário ou quantidade inválidos.", ephemeral: true });
  }

  const user = await User.findOneAndUpdate(
    { guildId, userId: targetUser.id },
    { $inc: { saldo: subcommand === "adicionar" ? quantidade : -quantidade } },
    { upsert: true, new: true }
  );

  return interaction.reply({ content: `✅ Saldo de ${targetUser.tag} atualizado para ${user.saldo}.`, ephemeral: true });
}
