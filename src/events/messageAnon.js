import { EmbedBuilder } from "discord.js";
import { baixarAnexos } from "../utils/attachments.js";
import { horaBrasilia } from "../utils/time.js";
import { config } from "../config.js";

export async function onMessageAnon(message, client) {
  if (message.author.bot || !message.content.toLowerCase().startsWith("+leca")) return;

  const cleanContent = message.content.slice(5).trim();
  const files = await baixarAnexos(message);
  if (!cleanContent && files.length === 0) return;

  // Preservar replies
  let replyOptions = {};
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (refMsg) replyOptions = { reply: { messageReference: refMsg.id, failIfNotExists: false } };
  }

  await message.delete().catch(() => {});
  await message.channel.send({
    content: "sua mensagem foi escondida 💕",
    embeds: cleanContent ? [new EmbedBuilder().setDescription(cleanContent)] : undefined,
    files: files.length > 0 ? files : undefined,
    ...replyOptions
  });

  // Log
  const { logChannelId } = config;
  if (!logChannelId) return;

  const logChannel = message.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setDescription(`**mensagem:** ${cleanContent || "* (sem descrição)*"}`)
    .setFooter({
      text: `publicado por: ${message.author.tag} (${message.author.id})\n#${message.channel.name} | ${horaBrasilia()}`
    });

  await logChannel.send({
    content: "Registro de Auditoria 💕",
    embeds: [embed],
    files: files.length > 0 ? files : undefined,
    ...replyOptions
  });
}
