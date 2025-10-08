import { mensagemSegura } from "../utils/mensagemSegura.js";

export async function handlePurgeAllPapinhos(interaction) {
  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Apenas administradores.", ephemeral: true });
  }

  const canal = interaction.channel;
  await interaction.deferReply({ ephemeral: true });

  try {
    let count = 0;
    let mensagens = await canal.messages.fetch({ limit: 100 });

    while (mensagens.size) {
      const semMidia = [];

      for (const msg of mensagens.values()) {
        if (await mensagemSegura(msg, mensagens)) semMidia.push(msg);
      }

      if (!semMidia.length) break;

      for (const m of semMidia) {
        await m.delete().catch(() => {});
        count++;
      }

      const lastId = mensagens.last().id;
      mensagens = await canal.messages.fetch({ limit: 100, before: lastId });
    }

    await interaction.editReply(`✅ ${count} mensagens removidas.`);
  } catch (err) {
    console.error("Erro /purge all papinhos:", err);
    await interaction.editReply("❌ Erro ao executar purge all.");
  }
}
