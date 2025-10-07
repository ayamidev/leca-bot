import { client } from "./client.js";
import { config } from "./config.js";
import { onReady } from "./events/ready.js";
import { onMessageAnon } from "./events/messageAnon.js";
import { onMonitorLog } from "./events/monitorLog.js";
import { handleSetLog } from "./commands/setlog.js";
import { handleSetDefaultLog } from "./commands/setDefaultLog.js";
import { handleExcluirPapinhoFurado } from "./commands/excluirPapinhoFurado.js";
import { handleLeca } from "./commands/leca.js";

// Evento de inicialização
client.once("ready", () => onReady(client));

// Evento de comandos slash
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const commandMap = {
    setlog: handleSetLog,
    set_defaultlog: handleSetDefaultLog,
    excluir_papinho_furado: handleExcluirPapinhoFurado,
    leca: handleLeca
  };

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

// Eventos de mensagens
client.on("messageCreate", async (message) => {
  await onMessageAnon(message, client);
  await onMonitorLog(message, client);
});

// Login no Discord
client.login(config.TOKEN)
  .then(() => console.log("🔑 Login enviado ao Discord..."))
  .catch(err => console.error("❌ Falha ao logar:", err));
