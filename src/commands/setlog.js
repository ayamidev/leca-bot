import { Server } from "../models/Server.js";

export async function handleSetLog(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Apenas administradores.", ephemeral: true });
  }

  const canal = interaction.options.getChannel("canal");
  if (!canal) return interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });

  // Atualiza ou cria registro no MongoDB
  await Server.findOneAndUpdate(
    { guildId: interaction.guild.id },
    { $set: { "channels.logChannelId": canal.id } },
    { upsert: true, new: true }
  );

  await interaction.reply({ content: `Canal de log definido para ${canal}`, ephemeral: true });
}