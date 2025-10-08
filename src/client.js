import express from "express";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config.js";
import { conectarDB } from "./db.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel]
});

async function init() {
  await conectarDB();

  // Servidor HTTP básico
  const app = express();
  app.get("/", (req, res) => res.send("Bot Leca está online! 💕"));
  app.listen(config.PORT, () => console.log(`🌐 Servidor HTTP ativo na porta ${config.PORT}`));
}

init();

export { client };
