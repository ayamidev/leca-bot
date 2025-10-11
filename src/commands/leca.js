export async function handleLeca(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    await interaction.reply({
      content: "❌ Apenas administradores podem usar este comando.",
      ephemeral: true
    });
    return;
  }

  const conteudo = interaction.options.getString("mensagem");
  const attachment = interaction.options.getAttachment("anexos"); // agora é um Attachment do Discord
  const canal = interaction.channel;

  await interaction.deferReply({ ephemeral: true });

  let files = [];
  if (attachment) {
    files.push({ attachment: attachment.url, name: attachment.name });
  }

  try {
    await canal.send({
      content: conteudo || undefined,
      files: files.length > 0 ? files : undefined
    });

    await interaction.editReply("✅ Mensagem enviada como Leca!");
  } catch (err) {
    console.error("Erro ao enviar mensagem da Leca:", err);
    await interaction.editReply("❌ Falha ao enviar a mensagem.");
  }
}
