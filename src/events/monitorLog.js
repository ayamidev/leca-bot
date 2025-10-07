import { embedContemLeca } from "../utils/embeds.js";
import { config } from "../config.js";

export async function onMonitorLog(message, client) {
  const { defaultLogChannelId } = config;
  if (!defaultLogChannelId || !message.guild) return;
  if (message.channel.id !== defaultLogChannelId) return;
  if (message.author.id === client.user.id) return;

  console.log(`[DEBUG] Mensagem em #${message.channel.name} por ${message.author.tag}:`, message.content);

  const hasLeca = 
    (message.content?.toLowerCase().includes("+leca")) ||
    (message.embeds?.some(embedContemLeca));

  if (hasLeca) {
    await message.delete().catch(() => {});
    console.log(`🧹 Mensagem com +leca removida em #${message.channel.name}`);
  }
}
