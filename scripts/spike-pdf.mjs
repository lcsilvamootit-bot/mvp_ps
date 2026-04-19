import { readFileSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Point to the bundled worker so we don't need a separate worker process
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = '/home/leo/Downloads/GEOVANI CASTRO - HISTORICO.pdf';
const MAX_PAGES = 5; // spike: analyze first 5 pages

async function main() {
  const data = new Uint8Array(readFileSync(PDF_PATH));
  const pdf = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

  console.log(`=== PDF INFO ===`);
  console.log(`Total pages: ${pdf.numPages}`);

  const pagesToInspect = Math.min(MAX_PAGES, pdf.numPages);

  for (let p = 1; p <= pagesToInspect; p++) {
    const page = await pdf.getPage(p);
    console.log(`\n=== PAGE ${p} ===`);

    // Text content
    const textContent = await page.getTextContent();
    console.log(`  Items count: ${textContent.items.length}`);

    // Print first 60 items with their transforms (x, y, width, height, font)
    const sample = textContent.items.slice(0, 80);
    for (const item of sample) {
      if (!item.str) continue;
      const [a, b, c, d, x, y] = item.transform;
      console.log(`  [x=${x.toFixed(0)} y=${y.toFixed(0)} w=${item.width?.toFixed(0)} h=${item.height?.toFixed(0)} font=${item.fontName}] "${item.str}"`);
    }

    // Annotations (hyperlinks, etc.)
    const annotations = await page.getAnnotations();
    if (annotations.length) {
      console.log(`\n  --- ANNOTATIONS (${annotations.length}) ---`);
      for (const ann of annotations.slice(0, 20)) {
        console.log(`  [${ann.subtype}] url=${ann.url ?? ann.dest ?? ''} rect=${ann.rect?.map(n=>n.toFixed(0)).join(',')}`);
      }
    }
  }

  // Also look for URL patterns in all text across first 5 pages
  console.log('\n=== URL PATTERNS (all text items containing "http") ===');
  for (let p = 1; p <= pagesToInspect; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    for (const item of tc.items) {
      if (item.str?.includes('http')) {
        console.log(`  p${p}: "${item.str}"`);
      }
    }
  }

  // Unique font names across first 5 pages
  const fonts = new Set();
  for (let p = 1; p <= pagesToInspect; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    for (const item of tc.items) {
      if (item.fontName) fonts.add(item.fontName);
    }
  }
  console.log('\n=== UNIQUE FONTS ===');
  console.log([...fonts].join(', '));
}

main().catch(err => { console.error(err); process.exit(1); });
