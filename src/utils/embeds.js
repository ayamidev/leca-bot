export function embedContemLeca(embed) {
  const partes = [];

  if (embed.title) partes.push(embed.title);
  if (embed.description) partes.push(embed.description);
  if (embed.fields)
    embed.fields.forEach(f => {
      if (f.name) partes.push(f.name);
      if (f.value) partes.push(f.value);
    });

  return partes.some(text =>
    text.replace(/[`]/g, '').replace(/\s+/g, ' ').toLowerCase().includes("+leca")
  );
}
