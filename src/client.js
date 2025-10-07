import express from "express";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel]
});

// Servidor HTTP básico
const app = express();
app.get("/", (req, res) => res.send("Bot Leca está online! 💕"));
app.listen(config.PORT, () => console.log(`🌐 Servidor HTTP ativo na porta ${config.PORT}`));

export { client };
