#!/usr/bin/env node
// check-token-refs.mjs — a "compile error" for token breakage.
// Given the exact set of token variable names a new export REMOVES/renames
// (computed by export-tokens.mjs from its diff), scan consumer source for any
// still-live reference to them and fail (exit 1, file:line). Matching exact
// removed names — not a prefix guess — means zero false positives against CSS
// properties (`border-radius`) or class names (`icon-1`).
//
// Usage:
//   node check-token-refs.mjs --removed <a-b-c,…  | @file>  --src <dir> [--src <dir>…]
//   --removed : comma list of removed token VAR names (e.g. colors-ui-surface-canvas),
//               or @path to a file with one name per line. (export-tokens.mjs emits these.)
//   --src     : consumer source root(s), scanned recursively for *.styl (skips /generated/).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const srcDirs = args.reduce((a, x, i) => (x === '--src' ? [...a, args[i + 1]] : a), []);
let removedArg = opt('--removed') || '';
if (removedArg.startsWith('@')) removedArg = readFileSync(removedArg.slice(1), 'utf8').split(/\s+/).join(',');
const removed = [...new Set(removedArg.split(',').map((s) => s.trim()).filter(Boolean))];
if (!removed.length || !srcDirs.length) { console.error('usage: --removed <names|@file> --src <dir> [--src …]'); process.exit(2); }

// One regex, exact word-boundary match for any removed name.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rx = new RegExp(`(?<![\\w-])(?:${removed.map(esc).join('|')})(?![\\w-])`, 'g');

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e); const st = statSync(p);
    if (st.isDirectory()) { if (e !== 'generated' && e !== 'node_modules' && e[0] !== '.') walk(p, acc); }
    else if (e.endsWith('.styl')) acc.push(p);
  }
  return acc;
};

const hits = [];
for (const dir of srcDirs) for (const file of walk(dir)) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const code = line.split('//')[0];
    for (const m of code.matchAll(rx)) hits.push({ file, line: i + 1, ref: m[0] });
  });
}

if (hits.length) {
  console.error(`\n✖ token export would BREAK ${hits.length} live reference(s) to ${new Set(hits.map(h => h.ref)).size} removed token(s):\n`);
  for (const h of hits) console.error(`  ${relative(process.cwd(), h.file)}:${h.line}: ${h.ref}`);
  console.error(`\n  Fix: migrate these refs to the renamed token, or keep the token in Figma. (${removed.length} removed name(s) checked.)`);
  process.exit(1);
}
console.log(`✓ no consumer references the ${removed.length} removed token(s); export is safe.`);
