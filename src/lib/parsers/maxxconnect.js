import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

// pdfjs-dist v5 in Node.js does a dynamic import(workerSrc) unless this global is set first.
globalThis.pdfjsWorker = { WorkerMessageHandler };

const EXT_TO_TIPO = {
  mp3: 'audio', ogg: 'audio', m4a: 'audio', aac: 'audio', wav: 'audio',
  mp4: 'video', mov: 'video', avi: 'video', webm: 'video',
  png: 'imagem', jpg: 'imagem', jpeg: 'imagem', gif: 'imagem', webp: 'imagem',
  pdf: 'documento', doc: 'documento', docx: 'documento', xls: 'documento', xlsx: 'documento',
};

const SENDER_RE  = /^\((?<tipo>Cliente|Empresa)\)\s+(?<nome>.+?)(?:\s*-\s*\d+)?$/;
const ARQUIVO_RE = /^Arquivo:\s+(?<filename>.+?)(?:\s*\|\|\s*Legenda:\s*(?<legenda>.+))?$/;
const BOLD_PREFIX_RE = /^\*[^*]+\*:/;

const SENDER_X_MAX = 200;
const MSG_X_MIN    = 280;
const HEADER_Y     = 510;

function tipoFromUrl(url) {
  if (!url) return 'documento';
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  return EXT_TO_TIPO[ext] ?? 'documento';
}

function parseSender(raw) {
  const m = raw.trim().match(SENDER_RE);
  if (!m) return null;
  const nome = m.groups.nome.trim();
  if (nome.toLowerCase().includes('enviado por outros aplicativos')) {
    return { remetente: 'sistema', remetenteNome: nome };
  }
  return {
    remetente: m.groups.tipo === 'Cliente' ? 'cliente' : 'empresa',
    remetenteNome: nome,
  };
}

function parseArquivo(str) {
  const m = str.trim().match(ARQUIVO_RE);
  if (!m) return null;
  return { filename: m.groups.filename.trim(), legenda: m.groups.legenda?.trim() ?? null };
}

function buildAnnotationMap(annotations) {
  const map = new Map();
  for (const ann of annotations) {
    if (ann.subtype !== 'Link' || !ann.url) continue;
    const [, y1, , y2] = ann.rect;
    map.set(Math.round((y1 + y2) / 2), ann.url);
  }
  return map;
}

function nearestUrl(annMap, itemY, tolerance = 6) {
  const target = Math.round(itemY);
  if (annMap.has(target)) return annMap.get(target);
  for (const [k, v] of annMap) {
    if (Math.abs(k - target) <= tolerance) return v;
  }
  return null;
}

// Maxxconnect PDFs place the sender label in the vertical middle of a table cell,
// so message content can appear ABOVE the sender's y-coordinate in the scan order.
// We buffer content when we see a new-message marker (*Name*:) or an Arquivo item
// that can't belong to the current group, then flush when the sender label is found.
function groupPageItems(pageItems) {
  const groups = [];
  let current = null;
  let pending = [];
  let bufferActive = false;

  for (const it of pageItems) {
    if (it.x < SENDER_X_MAX && parseSender(it.str)) {
      current = { senderRaw: it.str, msgItems: [...pending] };
      pending = [];
      bufferActive = false;
      groups.push(current);
    } else if (it.x >= MSG_X_MIN) {
      const isNewMsgMarker = BOLD_PREFIX_RE.test(it.str) ||
        (parseArquivo(it.str) !== null && current !== null && current.msgItems.length > 0);

      if (current === null || bufferActive) {
        pending.push(it);
        if (current === null) bufferActive = true;
      } else if (isNewMsgMarker) {
        pending.push(it);
        bufferActive = true;
      } else {
        current.msgItems.push(it);
      }
    }
  }
  if (pending.length && current) current.msgItems.push(...pending);
  return groups;
}

function buildSubMessages(msgItems, annMap) {
  const subMessages = [];
  let textBuf = [];

  for (let i = 0; i < msgItems.length; i++) {
    const it = msgItems[i];
    const arquivoMatch = parseArquivo(it.str);

    if (arquivoMatch) {
      if (textBuf.length) { subMessages.push({ tipo: 'text-run', items: textBuf }); textBuf = []; }

      let legenda = arquivoMatch.legenda;
      while (i + 1 < msgItems.length) {
        const next = msgItems[i + 1];
        if (parseArquivo(next.str) || BOLD_PREFIX_RE.test(next.str)) break;
        if (nearestUrl(annMap, next.y, 8)) {
          legenda = (legenda ? legenda + ' ' : '') + next.str.trim();
          i++;
        } else break;
      }
      subMessages.push({ tipo: 'arquivo', item: it, meta: { ...arquivoMatch, legenda } });
    } else {
      textBuf.push(it);
    }
  }
  if (textBuf.length) subMessages.push({ tipo: 'text-run', items: textBuf });
  return subMessages;
}

function subMessagesToItems(subMessages, senderInfo, annMap, ordemStart) {
  const result = [];
  let ordem = ordemStart;

  for (const sub of subMessages) {
    if (sub.tipo === 'text-run') {
      let conteudo = sub.items.map(i => i.str).join(' ').trim();
      conteudo = conteudo.replace(/^\*[^*]+\*:\s*/, '');
      if (!conteudo || /^Legenda:\s/i.test(conteudo)) continue;
      ordem++;
      result.push({ ordem, ...senderInfo, tipo: 'texto', conteudo, urlAnexo: null, legenda: null, transcricao: null });
    } else {
      const { item, meta } = sub;
      const url = nearestUrl(annMap, item.y);
      ordem++;
      result.push({ ordem, ...senderInfo, tipo: tipoFromUrl(url ?? meta.filename), conteudo: null, urlAnexo: url, legenda: meta.legenda, transcricao: null });
    }
  }
  return result;
}

export async function parseMaxxconnectPdf(buffer) {
  const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const pdf = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

  const items = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const [textContent, annotations] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
    const annMap = buildAnnotationMap(annotations);

    const pageItems = textContent.items
      .filter(it => it.str?.trim() && it.transform[5] <= HEADER_Y)
      .map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    for (const group of groupPageItems(pageItems)) {
      const senderInfo = parseSender(group.senderRaw);
      if (!senderInfo) continue;
      const msgItems = group.msgItems.sort((a, b) => b.y - a.y);
      const subMessages = buildSubMessages(msgItems, annMap);
      const newItems = subMessagesToItems(subMessages, senderInfo, annMap, items.length);
      items.push(...newItems);
    }
  }

  return items;
}
