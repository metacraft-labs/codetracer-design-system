#!/usr/bin/env node
// export-tokens.mjs — developer-run token export (Figma → repo DTCG JSON).
// No CI: it uses the developer's own Figma login. Two steps:
//   1. get a GENERIC reflection dump of the Figma variables (scripts/figma-dump.js);
//   2. build-tokens.mjs → DTCG, then diff against (or --write to) brand/alias/mapped.
//
// Supplying the dump (step 1) — pick one:
//   A) --dump <file.json>  A dump produced by running scripts/figma-dump.js through
//      ANY authenticated Figma MCP client. Simplest today: in your Figma-MCP-enabled
//      editor (Claude/Cursor), run figma-dump.js via `use_figma` and save the JSON.
//      After that this script is fully offline and deterministic.
//   B) live MCP (see NOTES at the bottom) — a ~30-line MCP-SDK client that connects
//      to $FIGMA_MCP_URL as you and runs figma-dump.js. Verify once against your
//      Figma MCP setup, then it's a single command.
//
// Usage:
//   node export-tokens.mjs --dump dump.json           # build + DIFF vs repo (no writes)
//   node export-tokens.mjs --dump dump.json --write    # apply to <col>/<col>.json
//
// Maintainability: this file has NO token names. Adding variables/collections/modes
// in Figma needs no change here — see TOKEN-EXPORT-CONVENTIONS.md.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTokens } from './build-tokens.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url))); // codetracer-design-system/
const args = process.argv.slice(2);
const dumpPath = args[args.indexOf('--dump') + 1];
const write = args.includes('--write');
if (!dumpPath || !existsSync(dumpPath)) {
  console.error('usage: node export-tokens.mjs --dump <dump.json> [--write]\n(produce dump.json by running scripts/figma-dump.js via your Figma MCP client — see NOTES)');
  process.exit(1);
}

const dump = JSON.parse(readFileSync(dumpPath, 'utf8'));
const tokens = buildTokens(dump);

// Compare on structure+values only — the current TS export carries a
// `$extensions.com.figma.*` block the consumers ignore, and our mode-policy-A
// output adds `$extensions.modes`; strip all `$extensions` before diffing.
const stripExt = (o) => {
  if (Array.isArray(o)) return o.map(stripExt);
  if (o && typeof o === 'object') {
    const r = {};
    for (const [k, v] of Object.entries(o)) if (k !== '$extensions') r[k] = stripExt(v);
    return r;
  }
  return o;
};
function leaves(o, path = [], acc = {}) {
  if (o && typeof o === 'object' && '$value' in o) { acc[path.join('.')] = { $type: o.$type, $value: o.$value }; return acc; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) leaves(v, [...path, k], acc);
  return acc;
}

let totalDiffs = 0;
for (const [name, obj] of Object.entries(tokens)) {
  const repoFile = join(REPO, name, `${name}.json`);
  const gen = leaves(stripExt(obj));
  if (existsSync(repoFile)) {
    const cur = leaves(stripExt(JSON.parse(readFileSync(repoFile, 'utf8'))));
    const keys = new Set([...Object.keys(gen), ...Object.keys(cur)]);
    const diffs = [];
    for (const k of keys) {
      const a = cur[k], b = gen[k];
      if (!a) diffs.push(`  + ${k} = ${JSON.stringify(b.$value)} (${b.$type})`);
      else if (!b) diffs.push(`  - ${k} (was ${JSON.stringify(a.$value)})`);
      else if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(`  ~ ${k}: ${JSON.stringify(a.$value)}(${a.$type}) -> ${JSON.stringify(b.$value)}(${b.$type})`);
    }
    totalDiffs += diffs.length;
    console.log(`\n[${name}] ${diffs.length} difference(s) vs repo (of ${Object.keys(gen).length} tokens)`);
    diffs.slice(0, 40).forEach(d => console.log(d));
    if (diffs.length > 40) console.log(`  … ${diffs.length - 40} more`);
  } else {
    console.log(`\n[${name}] new collection (${Object.keys(gen).length} tokens) — no repo file yet`);
  }
  if (write) {
    mkdirSync(join(REPO, name), { recursive: true });
    writeFileSync(repoFile, JSON.stringify(obj, null, 2) + '\n');
    console.log(`  wrote ${name}/${name}.json`);
  }
}
console.log(`\n${write ? 'WROTE files. ' : ''}Total structural diffs vs repo: ${totalDiffs}`);

// ── NOTES: live-MCP transport (option B) ─────────────────────────────────────
// A standalone MCP client (developer's own Figma login) that fetches the dump:
//
//   import { Client } from '@modelcontextprotocol/sdk/client/index.js';
//   import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
//   const client = new Client({ name: 'ct-token-export', version: '1' });
//   await client.connect(new StreamableHTTPClientTransport(new URL(process.env.FIGMA_MCP_URL),
//                        { authProvider: /* OAuth provider – opens browser once, caches token */ }));
//   const code = readFileSync('scripts/figma-dump.js', 'utf8');
//   const res = await client.callTool({ name: 'use_figma',
//                 arguments: { fileKey: process.env.FIGMA_FILE, code } });
//   const dump = JSON.parse(res.content[0].text);   // then buildTokens(dump) as above
//
// Verify FIGMA_MCP_URL + the OAuth handshake once against your Figma MCP; for large
// files, loop per-collection (prepend `const ONLY=["mapped"];` to figma-dump.js) so
// each response stays under the MCP size cap.
