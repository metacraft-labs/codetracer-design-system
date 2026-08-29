// validate-collection.mjs — normalize a committed DTCG collection file the same
// way build-tokens produces it (strip $extensions, keep $type/$value, sort keys),
// then print { count, len, hash }. The Figma-side reflection computes the SAME
// three numbers with the SAME stable()/djb2() below; equal numbers ⇒ parity.
import { readFileSync } from 'node:fs';

const strip = (o) => Array.isArray(o) ? o.map(strip)
  : (o && typeof o === 'object')
    ? Object.fromEntries(Object.entries(o).filter(([k]) => k !== '$extensions').map(([k, v]) => [k, strip(v)]))
    : o;
export const stable = (o) => Array.isArray(o) ? '[' + o.map(stable).join(',') + ']'
  : (o && typeof o === 'object') ? '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}'
  : JSON.stringify(o);
export const djb2 = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };
const count = (o, n = 0) => (o && typeof o === 'object' && '$value' in o) ? n + 1
  : (o && typeof o === 'object') ? Object.values(o).reduce((a, v) => count(v, a), n) : n;

if (import.meta.url === `file://${process.argv[1]}`) {
  const norm = strip(JSON.parse(readFileSync(process.argv[2], 'utf8')));
  const s = stable(norm);
  console.log(JSON.stringify({ file: process.argv[2], count: count(norm), len: s.length, hash: djb2(s) }));
}
