/**
 * Comando /purge papinhos
 * Exclui uma quantidade definida de mensagens sem mídia/anexos
 */
export async function handlePurgePapinhos(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({
      content: "❌ Apenas administradores podem usar este comando.",
      ephemeral: true
    });
  }

  const quantidade = interaction.options.getInteger("quantidade");
  const canal = interaction.channel;

  await interaction.deferReply({ ephemeral: true });

  try {
    const mensagens = await canal.messages.fetch({ limit: 100 });

    // Filtra mensagens seguras para deletar
    const semMidia = [];
    for (const msg of mensagens.values()) {
      if (await mensagemSegura(msg)) semMidia.push(msg);
      if (semMidia.length >= quantidade) break;
    }

    if (!semMidia.length) {
      await interaction.editReply("🧼 Nenhuma mensagem segura para apagar encontrada!");
      return;
    }

    let count = 0;
    for (const msg of semMidia) {
      await msg.delete().catch(() => {});
      count++;
    }

    await interaction.editReply(`✅ ${count} mensagens sem mídia foram removidas.`);
  } catch (err) {
    console.error("Erro ao executar /purge papinhos:", err);
    await interaction.editReply("❌ Ocorreu um erro ao tentar excluir as mensagens.");
  }
}

/**
 * Verifica se a mensagem pode ser apagada com segurança
 */
async function mensagemSegura(msg) {
  // Ignora mensagens com anexos, stickers ou embeds com mídia
  if (msg.attachments.size > 0) return false;
  if (msg.stickers.size > 0) return false;
  if (msg.embeds.some(e => e.image || e.video || (e.thumbnail && e.thumbnail.url))) return false;

  // Se for reply
  if (msg.reference && msg.reference.messageId) {
    try {
      const refMsg = await msg.channel.messages.fetch(msg.reference.messageId);
      if (!refMsg) {
        // Mensagem referenciada não encontrada no mesmo canal → provavelmente forward, não apagar
        return false;
      }
      // Se encontrou a mensagem referenciada no mesmo canal → reply segura
      return true;
    } catch {
      // Não conseguiu buscar → tratar como forward → não apagar
      return false;
    }
  }

  // Mensagem normal sem mídia → segura
  return true;
}
