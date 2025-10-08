/**
 * mensagemSegura(msg, batchMessages?)
 * Retorna:
 *   true  => deve ser excluída
 *   false => deve ser mantida
 */
export async function mensagemSegura(msg, batchMessages = null) {
  // 1) Se a mensagem contém anexos:
  if (msg.attachments.size > 0) {
    // Só exclui se todos forem áudios (voice messages)
    const todosAudios = [...msg.attachments.values()].every(a => {
      const ct = a.contentType || a.content_type || "";
      return typeof ct === "string" && ct.startsWith("audio/");
    });
    return todosAudios; // true = apaga se forem todos áudios
  }

  // 2) Stickers -> mantém
  if (msg.stickers.size > 0) return false;

  // 3) Embeds com mídia -> mantém
  if (msg.embeds.some(e => e.image || e.video || (e.thumbnail && e.thumbnail.url))) {
    return false;
  }

  // 4) Caso seja reply ou encaminhamento
  const ref = msg.reference;
  if (ref && ref.messageId) {
    // a) Se aponta pra outro canal/servidor -> é encaminhamento -> mantém
    if (ref.channelId && ref.channelId !== msg.channel.id) return false;
    if (ref.guildId && msg.guild && ref.guildId !== msg.guild.id) return false;

    // b) Reply local no mesmo canal:
    const refId = ref.messageId;
    let refMsg = batchMessages?.get(refId) ?? null;

    if (!refMsg) {
      try {
        refMsg = await msg.channel.messages.fetch(refId);
      } catch {
        refMsg = null;
      }
    }

    if (refMsg) {
      // É reply válida no mesmo canal
      // -> deve ser apagada se for texto puro (sem anexo/mídia)
      const semMidia =
        msg.attachments.size === 0 &&
        !msg.embeds.some(e => e.image || e.video || (e.thumbnail && e.thumbnail.url)) &&
        msg.stickers.size === 0;
      return semMidia; // true = apaga reply de texto
    } else {
      // Mensagem referenciada foi apagada -> apaga
      return true;
    }
  }

  // 5) Se chegou aqui: texto puro sem mídia nem reply -> apaga
  return true;
}
