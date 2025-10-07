import dotenv from "dotenv";
dotenv.config();

const { TOKEN, CLIENT_ID, PORT } = process.env;

if (!TOKEN || !CLIENT_ID) {
  console.error("⚠️ TOKEN ou CLIENT_ID não definidos! Verifique o .env.");
  process.exit(1);
}

export const config = {
  TOKEN,
  CLIENT_ID,
  PORT: PORT || 3000,
  logChannelId: null,
  defaultLogChannelId: null
};
