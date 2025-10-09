import mongoose from "mongoose";

const serverSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channels: {
    logChannelId: { type: String, default: null },
    defaultLogChannelId: { type: String, default: null },
  },
  moedaNome: { type: String, default: "lecash" } // nome da moeda
}, { timestamps: true });

export const Server = mongoose.model("Server", serverSchema);