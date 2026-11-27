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
//
// An empty --removed list (`--removed ''`, or an empty @file) is a pass: nothing
// was removed, so nothing can break. The downstream lane relies on this — it
// computes the list itself and runs this check on every candidate, including
// one that removes nothing. A --src root that does not exist, or that holds no
// *.styl file, is an error (exit 2): a scan of nothing would pass whatever the
// consumer references.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const srcDirs = args.reduce((a, x, i) => (x === '--src' ? [...a, args[i + 1]] : a), []);
const usage = () => { console.error('usage: --removed <names|@file> --src <dir> [--src …]'); process.exit(2); };
let removedArg = opt('--removed');
if (removedArg === null || removedArg === undefined || !srcDirs.length || srcDirs.some((d) => !d)) usage();
if (removedArg.startsWith('@')) removedArg = readFileSync(removedArg.slice(1), 'utf8').split(/\s+/).join(',');
const removed = [...new Set(removedArg.split(',').map((s) => s.trim()).filter(Boolean))];

const missing = srcDirs.filter((d) => !existsSync(d) || !statSync(d).isDirectory());
if (missing.length) { console.error(`✖ --src is not a directory: ${missing.join(', ')}`); process.exit(2); }

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e); const st = statSync(p);
    if (st.isDirectory()) { if (e !== 'generated' && e !== 'node_modules' && e[0] !== '.') walk(p, acc); }
    else if (e.endsWith('.styl')) acc.push(p);
  }
  return acc;
};

const files = srcDirs.flatMap((dir) => walk(dir));
if (!files.length) { console.error(`✖ no *.styl file under ${srcDirs.join(', ')}: nothing to check`); process.exit(2); }
if (!removed.length) {
  console.log(`✓ no token removed; ${files.length} stylesheet(s) under ${srcDirs.length} root(s) need no check.`);
  process.exit(0);
}

// One regex, exact word-boundary match for any removed name.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rx = new RegExp(`(?<![\\w-])(?:${removed.map(esc).join('|')})(?![\\w-])`, 'g');

const hits = [];
for (const file of files) {
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
console.log(`✓ no consumer references the ${removed.length} removed token(s) in ${files.length} stylesheet(s); export is safe.`);
