import mongoose from "mongoose";
import { config } from "./config.js";

export async function conectarDB() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ Conectado ao MongoDB!");
  } catch (err) {
    console.error("❌ Erro ao conectar no MongoDB:", err);
  }
}