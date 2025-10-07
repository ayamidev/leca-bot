export async function handleExcluirPapinhoFurado(interaction) {
  // Apenas administradores podem usar
  if (!interaction.member.permissions.has("Administrator")) {
    await interaction.reply({
      content: "❌ Apenas administradores podem usar este comando.",
      ephemeral: true
    });
    return;
  }

  const quantidade = interaction.options.getInteger("quantidade");
  const canal = interaction.channel;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Busca até 100 mensagens recentes
    const mensagens = await canal.messages.fetch({ limit: 100 });

    // Filtra apenas as que NÃO têm anexos nem embeds com mídia
    const semMidia = mensagens.filter(m => 
      !m.attachments.size &&
      !m.embeds.some(e =>
        e.image || e.video || (e.thumbnail && e.thumbnail.url)
      )
    );

    const aExcluir = quantidade
      ? semMidia.first(quantidade)
      : Array.from(semMidia.values());

    if (aExcluir.length === 0) {
      await interaction.editReply("🧼 Nenhuma mensagem sem mídia encontrada!");
      return;
    }

    let count = 0;
    for (const msg of aExcluir) {
      await msg.delete().catch(() => {});
      count++;
    }

    await interaction.editReply(`✅ ${count} mensagens sem mídia foram removidas do canal.`);
  } catch (err) {
    console.error("Erro ao excluir papinhos furados:", err);
    await interaction.editReply("❌ Ocorreu um erro ao tentar excluir as mensagens.");
  }
}
