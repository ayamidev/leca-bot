import { config } from "../config.js";

export async function handleSetLog(interaction) {
  // Apenas administradores
  if (!interaction.member.permissions.has("Administrator")) {
    await interaction.reply({
      content: "❌ Apenas administradores podem usar este comando.",
      ephemeral: true
    });
    return;
  }

  const canal = interaction.options.getChannel("canal");
  if (!canal) {
    await interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });
    return;
  }

  config.logChannelId = canal.id;
  await interaction.reply({
    content: `Canal de log definido com sucesso para ${canal}!`,
    ephemeral: true
  });
}
