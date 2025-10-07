import { registrarComandos } from "../commands/index.js";

export async function onReady(client) {
  console.log(`✅ Logado como ${client.user.tag}`);
  await registrarComandos();
}
