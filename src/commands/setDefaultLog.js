import { Server } from "../models/server.js";

export async function handleSetDefaultLog(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Apenas administradores.", ephemeral: true });
  }

  const canal = interaction.options.getChannel("canal");
  if (!canal) return interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });

  await Server.findOneAndUpdate(
    { guildId: interaction.guild.id },
    { $set: { "channels.defaultLogChannelId": canal.id } },
    { upsert: true, new: true }
  );

  await interaction.reply({ content: `Canal de monitoramento definido para ${canal}`, ephemeral: true });
}