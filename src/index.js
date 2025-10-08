import { client } from "./client.js";
import { config } from "./config.js";
import { onReady } from "./events/ready.js";
import { onMessageAnon } from "./events/messageAnon.js";
import { onMonitorLog } from "./events/monitorLog.js";

// Comandos
import { handleSetLog } from "./commands/setlog.js";
import { handleSetDefaultLog } from "./commands/setDefaultLog.js";
import { handleLeca } from "./commands/leca.js";
import { handlePurgePapinhos } from "./commands/purgePapinhos.js";
import { handlePurgeAllPapinhos } from "./commands/purgeAllPapinhos.js";

// --- Evento de inicialização ---
client.once("ready", () => onReady(client));

// --- Mapeamento de comandos ---
const commandMap = {
  setlog: handleSetLog,
  set_defaultlog: handleSetDefaultLog,
  leca: handleLeca,
  purge: async (interaction) => {
    // Subcomandos
    const sub = interaction.options.getSubcommand();
    if (sub === "papinhos") await handlePurgePapinhos(interaction);
    else if (sub === "all_papinhos") await handlePurgeAllPapinhos(interaction);
    else
      await interaction.reply({
        content: "❌ Subcomando inválido.",
        ephemeral: true
      });
  }
};

// --- Evento de comandos slash ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const handler = commandMap[interaction.commandName];
  if (handler) {
    try {
      await handler(interaction);
    } catch (err) {
      console.error(`Erro ao executar comando /${interaction.commandName}:`, err);
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Ocorreu um erro ao executar o comando.", ephemeral: true });
      }
    }
  }
});

// --- Eventos de mensagens ---
client.on("messageCreate", async (message) => {
  await onMessageAnon(message, client);
  await onMonitorLog(message, client);
});

// --- Login no Discord ---
client.login(config.TOKEN)
  .then(() => console.log("🔑 Login enviado ao Discord..."))
  .catch(err => console.error("❌ Falha ao logar:", err));
