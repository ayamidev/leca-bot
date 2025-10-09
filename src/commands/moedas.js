import { Server } from "../models/server.js";
import { User } from "../models/user.js";

export async function handleDindinCmd(message) {
  const guildId = message.guild.id;
  const userId = message.author.id;
  const server = await Server.findOne({ guildId });
  const moeda = server?.moedaNome || "lecash";

  const user = await User.findOne({ guildId, userId }) || new User({ guildId, userId });

  const hoje = new Date();
  if (user.lastDindin && user.lastDindin.toDateString() === hoje.toDateString()) {
    return message.reply(`❌ Você já resgatou 10 ${moeda} hoje!`);
  }

  user.saldo += 10;
  user.lastDindin = hoje;
  await user.save();

  return message.reply(`✅ Você resgatou 10 ${moeda}! Saldo atual: ${user.saldo} ${moeda}`);
}

export async function handleSaldoCmd(message) {
  const guildId = message.guild.id;
  const userId = message.author.id;
  const server = await Server.findOne({ guildId });
  const moeda = server?.moedaNome || "lecash";

  const user = await User.findOne({ guildId, userId });
  const saldo = user?.saldo || 0;

  return message.reply(`💰 Saldo atual: ${saldo} ${moeda}`);
}

export async function handleApostaCmd(message, args) {
  const guildId = message.guild.id;
  const userId = message.author.id;
  const server = await Server.findOne({ guildId });
  const moeda = server?.moedaNome || "lecash";

  const lado = args[0]?.toLowerCase();
  const valor = parseInt(args[1]);

  if (!["cara","coroa"].includes(lado) || isNaN(valor) || valor <= 0) {
    return message.reply("❌ Uso correto: `+aposta cara|coroa quantidade`");
  }

  const user = await User.findOne({ guildId, userId }) || new User({ guildId, userId });

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
