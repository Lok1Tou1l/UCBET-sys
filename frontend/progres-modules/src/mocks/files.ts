/**
 * Generates real, previewable files (PDF / SVG image) in the browser so document
 * preview and download work with demo data. Never used when a real backend is connected.
 */
const ascii = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '?');
const esc = (s: string) => ascii(s).replace(/[()\\]/g, '\\$&');

export function makePdfBlob(title: string, lines: string[] = []): Blob {
  let content = `BT /F1 22 Tf 60 780 Td (${esc(title)}) Tj ET\n0.5 w 60 770 m 535 770 l S\n`;
  lines.forEach((l, i) => {
    content += `BT /F1 12 Tf 60 ${735 - i * 22} Td (${esc(l)}) Tj ET\n`;
  });
  content += `BT /F1 9 Tf 60 40 Td (Document de demonstration - PROGRES 2.0 - donnees synthetiques) Tj ET\n`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function makeImageDataUrl(title: string, subtitle = ''): string {
  const t = title.replace(/[<>&]/g, '');
  const s = subtitle.replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef2fb"/><stop offset="1" stop-color="#d9e1f5"/></linearGradient></defs>
<rect width="800" height="560" fill="url(#g)"/><rect x="40" y="40" width="720" height="480" rx="18" fill="#fff" stroke="#b3c3ea" stroke-width="2"/>
<rect x="70" y="80" width="150" height="190" rx="10" fill="#d9e1f5"/><circle cx="145" cy="145" r="34" fill="#7f97d6"/><rect x="95" y="195" width="100" height="50" rx="24" fill="#7f97d6"/>
<text x="260" y="110" font-family="Arial" font-size="30" font-weight="700" fill="#121f4d">${t}</text>
<text x="260" y="150" font-family="Arial" font-size="18" fill="#4d6bbd">${s}</text>
${[0, 1, 2, 3, 4].map((i) => `<rect x="260" y="${190 + i * 28}" width="${420 - i * 40}" height="10" rx="5" fill="#d9e1f5"/>`).join('')}
<text x="70" y="480" font-family="Arial" font-size="14" fill="#7f97d6">Document de démonstration · données synthétiques</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const cache = new Map<string, string>();

/** Blob/data URL for a demo document. `kind` decides the mime type. */
export function demoFileUrl(kind: 'pdf' | 'image', title: string, subtitle = ''): string {
  const key = `${kind}:${title}:${subtitle}`;
  let url = cache.get(key);
  if (!url) {
    url = kind === 'pdf' ? URL.createObjectURL(makePdfBlob(title, subtitle ? [subtitle] : [])) : makeImageDataUrl(title, subtitle);
    cache.set(key, url);
  }
  return url;
}
