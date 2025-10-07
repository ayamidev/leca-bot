import fetch from "node-fetch";

export async function baixarAnexos(message) {
  const arquivos = [];
  for (const [, a] of message.attachments) {
    const res = await fetch(a.url);
    const buf = Buffer.from(await res.arrayBuffer());
    arquivos.push({ attachment: buf, name: a.name });
  }
  return arquivos;
}
