import { google } from "googleapis";
import { Readable } from "stream";

let driveClient;

/**
 * Inicializa Google Drive usando variáveis de ambiente
 */
export async function initDrive() {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("Variável GOOGLE_CREDENTIALS não definida!");
  }
  if (!process.env.GOOGLE_TOKEN) {
    throw new Error("Variável GOOGLE_TOKEN não definida! Gere usando generateDriveToken.js");
  }

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const token = JSON.parse(process.env.GOOGLE_TOKEN);

  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials(token);

  driveClient = google.drive({ version: "v3", auth: oAuth2Client });
  console.log("✅ Google Drive inicializado!");
}

/**
 * Garante que uma pasta exista, criando se necessário
 */
export async function garantirPasta(nome, parentId = null) {
  if (!driveClient) throw new Error("Drive não inicializado!");

  const queryParts = [
    `name='${nome}'`,
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false"
  ];
  if (parentId) queryParts.push(`'${parentId}' in parents`);
  const query = queryParts.join(" and ");

  const res = await driveClient.files.list({ q: query, fields: "files(id, name)" });
  if (!res.data || !res.data.files) throw new Error("Falha ao listar pastas no Drive");

  if (res.data.files.length > 0) return res.data.files[0].id;

  const pasta = await driveClient.files.create({
    requestBody: {
      name: nome,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });

  return pasta.data.id;
}

/**
 * Faz upload de arquivo
 */
export async function uploadArquivo(buffer, nome, folderId = null) {
  if (!driveClient) throw new Error("Drive não inicializado!");

  try {
    const bufferStream = Readable.from(buffer);

    const res = await driveClient.files.create({
      requestBody: {
        name: nome,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: "application/octet-stream",
        body: bufferStream,
      },
      fields: "id, webViewLink",
    });

    console.log(`📤 Arquivo enviado: ${nome} (ID: ${res.data.id})`);
    return res.data;
  } catch (err) {
    console.error(`❌ Falha ao enviar ${nome}:`, err);
    throw err;
  }
}