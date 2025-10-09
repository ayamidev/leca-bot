import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  saldo: { type: Number, default: 0 },
  lastDindin: { type: Date, default: null } // para controlar resgate diário
}, { timestamps: true });

userSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);