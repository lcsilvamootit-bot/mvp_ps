import { readFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

globalThis.pdfjsWorker = { WorkerMessageHandler };

const data = new Uint8Array(readFileSync('/home/leo/Downloads/GEOVANI CASTRO - HISTORICO.pdf'));
const pdf = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise;
const page = await pdf.getPage(1);
const tc = await page.getTextContent();

// Show h=0 items (spacers)
const spacers = tc.items
  .filter(it => it.height === 0 && it.str?.trim())
  .sort((a, b) => b.transform[5] - a.transform[5]);

console.log('=== H=0 SPACER ITEMS (descending y) ===');
for (const it of spacers) {
  const x = it.transform[4].toFixed(0);
  const y = it.transform[5].toFixed(0);
  console.log(`x=${x} y=${y} w=${it.width?.toFixed(0)} "${it.str}"`);
}

// Show raw height of all items
console.log('\n=== ITEMS WITH h>0 sample (descending y) ===');
const nonzero = tc.items
  .filter(it => it.height > 0 && it.str?.trim())
  .sort((a, b) => b.transform[5] - a.transform[5])
  .slice(0, 30);
for (const it of nonzero) {
  const x = it.transform[4].toFixed(0);
  const y = it.transform[5].toFixed(0);
  const col = parseInt(x) < 200 ? 'SENDER' : 'MSG';
  console.log(`[${col}] x=${x} y=${y} h=${it.height?.toFixed(1)} "${it.str.slice(0,50)}"`);
}
