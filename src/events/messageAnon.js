import { Server } from "../models/server.js";
import { EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import path from "path";
import { garantirPasta, uploadArquivo } from "../services/driveOAuth.js";

// Função que processa o +leca
export async function onMessageAnon(message, client) {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith("+leca")) return;

  const cleanContent = message.content.slice(5).trim();

  // --- Baixar anexos antes de deletar ---
  const files = [];
  for (const [, a] of message.attachments) {
    try {
      const response = await fetch(a.url);
      const arrayBuffer = await response.arrayBuffer();
      files.push({ buffer: Buffer.from(arrayBuffer), name: a.name, mimeType: a.contentType });
    } catch (err) {
      console.error(`❌ Falha ao baixar ${a.name}:`, err);
    }
  }

  if (!cleanContent && files.length === 0) return;

  // --- Preservar reply ---
  let replyOptions = {};
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (refMsg) replyOptions = { reply: { messageReference: refMsg.id, failIfNotExists: false } };
  }

  // --- Deletar original e repostar imediatamente ---
  await message.delete().catch(() => {});
  const sendData = {
    content: "sua mensagem foi escondida 💕",
    embeds: cleanContent ? [new EmbedBuilder().setDescription(cleanContent)] : undefined,
    files: files.map(f => ({ attachment: f.buffer, name: f.name })),
    ...replyOptions
  };
  await message.channel.send(sendData);

  // --- Enviar log para o canal de auditoria ---
  const serverConfig = await Server.findOne({ guildId: message.guild.id });
  if (serverConfig && serverConfig.channels.logChannelId) {
    const logChannel = message.guild.channels.cache.get(serverConfig.channels.logChannelId);
    if (logChannel) {
      const descricao = cleanContent || "* (postagem sem descrição)*";
      const embed = new EmbedBuilder()
        .setDescription(`**mensagem:** ${descricao}`)
        .setFooter({
          text: `publicado por: ${message.author.tag} | (${message.author.id})\nem: #${message.channel.name} | ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false })}`
        });

      await logChannel.send({
        content: "Registro de Auditoria 💕",
        embeds: [embed],
        files: files.map(f => ({ attachment: f.buffer, name: f.name })),
        ...replyOptions
      });
    }
  }

  // --- Upload para Google Drive em paralelo ---
  (async () => {
    try {
      const lecaRootId = await garantirPasta("Leca");
      const guildFolderId = await garantirPasta(`${message.guild.id} - ${message.guild.name}`, lecaRootId);
      const channelFolderId = await garantirPasta(`${message.channel.id} - ${message.channel.name}`, guildFolderId);

      // Data e hora em fuso brasileiro
      const nowBr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });
      const [dia, mes, ano, hora, minuto] = nowBr.match(/\d+/g);
      const formattedDate = `${ano}.${mes}.${dia} - ${hora}h${minuto}`;

      // Upload paralelo
      await Promise.all(files.map(async f => {
        const { name: baseName, ext } = path.parse(f.name);
        const fileName = `${formattedDate} (${baseName})${ext}`;
        await uploadArquivo(f.buffer, fileName, channelFolderId);
      }));
    } catch (err) {
      console.error("❌ Erro ao enviar anexos para Drive:", err);
    }
  })();
}