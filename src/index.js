import { client } from "./client.js";
import { config } from "./config.js";
import { onMessageAnon } from "./events/messageAnon.js";
import { onMonitorLog } from "./events/monitorLog.js";
import { onMessageMoeda } from "./events/messageMoedas.js";
import { initDrive } from "./services/driveOAuth.js";

// Comandos slash
import { handleSetLog } from "./commands/setlog.js";
import { handleSetDefaultLog } from "./commands/setDefaultLog.js";
import { handleLeca } from "./commands/leca.js";
import { handlePurgePapinhos } from "./commands/purgePapinhos.js";
import { handlePurgeAllPapinhos } from "./commands/purgeAllPapinhos.js";
import { handleDindin } from "./commands/dindin.js";

// Registro de comandos
import { registerCommands } from "./services/commandRegistry.js";

// --- Inicialização assíncrona ---
(async () => {
  try {
    await initDrive();
    await client.login(config.TOKEN);
    console.log("🔑 Login enviado ao Discord...");
  } catch (err) {
    console.error("❌ Falha ao inicializar o bot:", err);
    process.exit(1);
  }
})();

// --- Evento de inicialização ---
client.once("ready", async () => {
  console.log(`✅ Logado como ${client.user.tag}`);
  // Registrar comandos globalmente
  await registerCommands(client);
});

// --- Evento de comandos slash ---
const commandMap = {
  setlog: handleSetLog,
  set_defaultlog: handleSetDefaultLog,
  leca: handleLeca,
  purge: async (interaction) => {
    try {
      const sub = interaction.options.getSubcommand();
      if (sub === "papinhos") await handlePurgePapinhos(interaction);
      else if (sub === "all_papinhos") await handlePurgeAllPapinhos(interaction);
      else await interaction.reply({ content: "❌ Subcomando inválido.", ephemeral: true });
    } catch (err) {
      console.error("❌ Erro no comando purge:", err);
      if (!interaction.replied)
        await interaction.reply({ content: "❌ Ocorreu um erro no purge.", ephemeral: true });
    }
  },
  dindin: handleDindin
};

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const handler = commandMap[interaction.commandName];
  if (handler) {
    try {
      await handler(interaction);
    } catch (err) {
      console.error(`❌ Erro ao executar comando /${interaction.commandName}:`, err);
      if (!interaction.replied)
        await interaction.reply({ content: "❌ Ocorreu um erro ao executar o comando.", ephemeral: true });
    }
  }
});

// --- Eventos de mensagens ---
client.on("messageCreate", async (message) => {
  try {

    await onMessageAnon(message, client);  // +leca
    await onMonitorLog(message, client);  // monitoramento de log
    await onMessageMoeda(message);        // +dindin, +saldo, +aposta
  } catch (err) {
    console.error("❌ Erro ao processar mensagem:", err);
  }
});
