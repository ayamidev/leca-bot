import mongoose from "mongoose";

const serverSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channels: {
    logChannelId: { type: String, default: null },
    defaultLogChannelId: { type: String, default: null },
    // Você pode adicionar novos canais no futuro aqui
  }
}, { timestamps: true });

export const Server = mongoose.model("Server", serverSchema);
