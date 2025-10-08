/**
 * Comando /purge all_papinhos
 * Exclui todas as mensagens sem mídia/anexos
 */
export async function handlePurgeAllPapinhos(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({
      content: "❌ Apenas administradores podem usar este comando.",
      ephemeral: true
    });
  }

  const canal = interaction.channel;
  await interaction.deferReply({ ephemeral: true });

  try {
    let count = 0;
    let mensagens = await canal.messages.fetch({ limit: 100 });

    while (mensagens.size) {
      const semMidia = [];
      for (const msg of mensagens.values()) {
        if (await mensagemSegura(msg)) semMidia.push(msg);
      }

      if (!semMidia.length) break;

      for (const msg of semMidia) {
        await msg.delete().catch(() => {});
        count++;
      }

      const lastId = mensagens.last().id;
      mensagens = await canal.messages.fetch({ limit: 100, before: lastId });
    }

    await interaction.editReply(`✅ ${count} mensagens sem mídia foram removidas.`);
  } catch (err) {
    console.error("Erro ao executar /purge all papinhos:", err);
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
