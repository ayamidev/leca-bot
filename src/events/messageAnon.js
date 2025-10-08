import { Server } from "../models/server.js";
import { EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

// Supondo que esta seja a função que processa o +leca
export async function onMessageAnon(message, client) {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith("+leca")) return;

  const cleanContent = message.content.slice(5).trim();

  // Baixar anexos
  const files = [];
  for (const [, a] of message.attachments) {
    const response = await fetch(a.url);
    const arrayBuffer = await response.arrayBuffer();
    files.push({ attachment: Buffer.from(arrayBuffer), name: a.name });
  }

  if (!cleanContent && files.length === 0) return;

  // Preservar reply
  let replyOptions = {};
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (refMsg) replyOptions = { reply: { messageReference: refMsg.id, failIfNotExists: false } };
  }

  await message.delete().catch(() => {});

  // Repost da mensagem
  const sendData = {
    content: "sua mensagem foi escondida 💕",
    embeds: cleanContent ? [new EmbedBuilder().setDescription(cleanContent)] : undefined,
    files: files.length > 0 ? files : undefined,
    ...replyOptions
  };

  await message.channel.send(sendData);

  // --- PEGAR OS CANAIS DO BANCO ---
  const server = await Server.findOne({ guildId: message.guild.id });
  if (!server || !server.channels.logChannelId) return; // Se não tiver log definido, não faz nada

  const logChannel = message.guild.channels.cache.get(server.channels.logChannelId);
  if (!logChannel) return;

  const descricao = cleanContent || "* (postagem sem descrição)*";

  const embed = new EmbedBuilder()
    .setDescription(`**mensagem:** ${descricao}`)
    .setFooter({
      text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false })}`
    });

  await logChannel.send({
    content: "Registro de Auditoria 💕",
    embeds: [embed],
    files: files.length > 0 ? files : undefined,
    ...replyOptions
  });
}
