import { REST, Routes } from "discord.js";
import { config } from "../config.js";

const { TOKEN, CLIENT_ID } = config;

export const commands = [
  {
    name: "setlog",
    description: "Define o canal de log a ser usado pela Leca",
    options: [{ name: "canal", description: "Canal de log", type: 7, required: true }]
  },
  {
    name: "set_defaultlog",
    description: "Define o canal de log original, usado pela Loritta por exemplo (monitoramento do +leca)",
    options: [{ name: "canal", description: "Canal para monitorar", type: 7, required: true }]
  },
  {
    name: "purge",
    description: "Gerencia exclusão de mensagens",
    options: [
      {
        name: "papinhos",
        description: "Excluir quantidade definida de mensagens sem mídia/anexos",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "quantidade",
            description: "Quantidade de mensagens sem mídia a excluir",
            type: 4, // INTEGER
            required: true
          }
        ]
      },
      {
        name: "all_papinhos",
        description: "Excluir todas as mensagens sem mídia/anexos",
        type: 1 // SUB_COMMAND
      }
    ]
  },
  {
    name: "leca",
    description: "A Leca envia uma mensagem como se fosse ela mesma",
    options: [
      {
        name: "mensagem",
        description: "Conteúdo da mensagem que a Leca vai postar",
        type: 3, // STRING
        required: true
      },
      {
        name: "anexos",
        description: "Arquivos a serem enviados junto (opcional)",
        type: 11, // ATTACHMENT
        required: false
      }
    ]
  }
];


export async function registrarComandos() {
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
}
