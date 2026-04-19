import { readFileSync } from 'fs';
import { parseMaxxconnectPdf } from '../src/lib/parsers/maxxconnect.js';

const buffer = readFileSync('/home/leo/Downloads/GEOVANI CASTRO - HISTORICO.pdf');
const items = await parseMaxxconnectPdf(buffer);

console.log(`Total items: ${items.length}\n`);

for (const item of items) {
  const content = item.tipo === 'texto'
    ? `"${item.conteudo?.slice(0, 80)}${item.conteudo?.length > 80 ? '...' : ''}"`
    : `[${item.tipo}] url=${item.urlAnexo?.split('/').pop()} legenda=${item.legenda ?? '-'}`;

  console.log(`#${item.ordem} [${item.remetente}/${item.remetenteNome}] ${content}`);
}

// Summary
const byType = {};
for (const it of items) byType[it.tipo] = (byType[it.tipo] ?? 0) + 1;
console.log('\n=== SUMMARY ===');
for (const [k, v] of Object.entries(byType)) console.log(`  ${k}: ${v}`);

const audios = items.filter(i => i.tipo === 'audio');
console.log(`\nAudio URLs (${audios.length}):`);
for (const a of audios.slice(0, 5)) console.log(`  ${a.urlAnexo}`);
