import { Server } from "../models/server.js";
import { User } from "../models/user.js";

export async function onMessageMoeda(message) {
  if (message.author.bot) return;

  const content = message.content.trim();
  if (!content.startsWith("+")) return; // só processa comandos de prefixo "+"

  const guildId = message.guild.id;
  const userId = message.author.id;
  const server = await Server.findOne({ guildId });
  const moeda = server?.moedaNome || "lecash";

  const user = await User.findOne({ guildId, userId }) || new User({ guildId, userId });

  // --- +dindin ---
  if (content.toLowerCase() === "+dindin") {
    const hoje = new Date();
    if (user.lastDindin && user.lastDindin.toDateString() === hoje.toDateString()) {
      return message.reply(`❌ Você já resgatou 10 ${moeda} hoje!`);
    }

    user.saldo += 10;
    user.lastDindin = hoje;
    await user.save();

    return message.reply(`✅ Você resgatou 10 ${moeda}! Saldo atual: ${user.saldo} ${moeda}`);
  }

  // --- +saldo ---
  if (content.toLowerCase() === "+saldo") {
    const saldo = user?.saldo || 0;
    return message.reply(`💰 Saldo atual: ${saldo} ${moeda}`);
  }

  // --- +aposta ---
  if (content.toLowerCase().startsWith("+aposta")) {
    const args = content.split(/\s+/).slice(1);
    const lado = args[0]?.toLowerCase();
    const valor = parseInt(args[1]);

    if (!["cara", "coroa"].includes(lado) || isNaN(valor) || valor <= 0) {
      return message.reply("❌ Uso correto: `+aposta cara|coroa quantidade`");
    }

    if (user.saldo < valor) return message.reply("❌ Saldo insuficiente!");

    const resultado = Math.random() < 0.5 ? "cara" : "coroa";

    if (lado === resultado) {
      user.saldo += valor;
      await user.save();
      return message.reply(`🎉 Você ganhou! Resultado: ${resultado}. Saldo atual: ${user.saldo} ${moeda}`);
    } else {
      user.saldo -= valor;
      await user.save();
      return message.reply(`😢 Você perdeu! Resultado: ${resultado}. Saldo atual: ${user.saldo} ${moeda}`);
    }
  }
}
