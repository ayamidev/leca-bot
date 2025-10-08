import { Server } from "../models/server.js";
import { embedContemLeca } from "../utils/embeds.js";

export async function onMonitorLog(message, client) {
  if (!message.guild) return;
  if (message.author.id === client.user.id) return;

  // --- PEGAR O CANAL DE MONITORAMENTO DO BANCO ---
  const server = await Server.findOne({ guildId: message.guild.id });
  if (!server || !server.channels.defaultLogChannelId) return;

  const defaultLogChannelId = server.channels.defaultLogChannelId;
  if (message.channel.id !== defaultLogChannelId) return;

  console.log(`[DEBUG] Mensagem em #${message.channel.name} por ${message.author.tag}:`, message.content);

  const hasLeca = 
    (message.content?.toLowerCase().includes("+leca")) ||
    (message.embeds?.some(embedContemLeca));

  if (hasLeca) {
    await message.delete().catch(() => {});
    console.log(`🧹 Mensagem com +leca removida em #${message.channel.name}`);
  }
}
