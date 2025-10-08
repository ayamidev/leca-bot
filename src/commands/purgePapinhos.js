import { mensagemSegura } from "../utils/mensagemSegura.js";

export async function handlePurgePapinhos(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Apenas administradores.", ephemeral: true });
  }

  const quantidade = interaction.options.getInteger("quantidade");
  const canal = interaction.channel;
  await interaction.deferReply({ ephemeral: true });

  try {
    const mensagens = await canal.messages.fetch({ limit: 100 }); // batch
    const semMidia = [];

    for (const msg of mensagens.values()) {
      if (await mensagemSegura(msg, mensagens)) semMidia.push(msg);
      if (semMidia.length >= quantidade) break;
    }

    if (semMidia.length === 0) {
      await interaction.editReply("🧼 Nenhuma mensagem segura para apagar encontrada!");
      return;
    }

    let count = 0;
    for (const m of semMidia) {
      await m.delete().catch(() => {});
      count++;
    }

    await interaction.editReply(`✅ ${count} mensagens removidas.`);
  } catch (err) {
    console.error("Erro /purge papinhos:", err);
    await interaction.editReply("❌ Erro ao executar purge.");
  }
}
