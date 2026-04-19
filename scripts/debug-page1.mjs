import { readFileSync } from 'fs';
import { parseMaxxconnectPdf } from '../src/lib/parsers/maxxconnect.js';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

globalThis.pdfjsWorker = { WorkerMessageHandler };

const data = new Uint8Array(readFileSync('/home/leo/Downloads/GEOVANI CASTRO - HISTORICO.pdf'));
const pdf = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise;
const page = await pdf.getPage(1);
const tc = await page.getTextContent();

// Print ALL items on page 1 with x, y, content
const items = tc.items
  .filter(it => it.str?.trim())
  .sort((a, b) => b.transform[5] - a.transform[5]);  // descending y

console.log('=== ALL PAGE 1 ITEMS (descending y) ===');
for (const it of items) {
  const x = it.transform[4].toFixed(0);
  const y = it.transform[5].toFixed(0);
  const col = parseInt(x) < 200 ? 'SENDER' : 'MSG';
  console.log(`[${col}] x=${x} y=${y} "${it.str.slice(0,60)}"`);
}
