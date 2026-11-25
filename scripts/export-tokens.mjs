#!/usr/bin/env node
// export-tokens.mjs — developer-run token export (Figma → repo DTCG JSON).
// No CI: it uses the developer's own Figma login. Two steps:
//   1. get a GENERIC reflection dump of the Figma variables (scripts/figma-dump.js);
//   2. build-tokens.mjs → DTCG, then diff against (or --write to) brand/alias/mapped/
//      space and typography/ (built from Figma's text styles).
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
//   node export-tokens.mjs --dump brand.json --dump mapped.json …   # several dumps
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
// One or more dumps: `--dump a.json --dump b.json` (one per collection when a
// single dump is too large for the MCP answer). Collections are merged; the
// text styles come from the first dump that has them.
const dumpPaths = args.flatMap((a, i) => a === '--dump' ? [args[i + 1]] : []);
const dumpPath = dumpPaths[0];
const write = args.includes('--write');
if (!dumpPath || dumpPaths.some(p => !p || !existsSync(p))) {
  console.error('usage: node export-tokens.mjs --dump <dump.json> [--write]\n(produce dump.json by running scripts/figma-dump.js via your Figma MCP client — see NOTES)');
  process.exit(1);
}

const dump = { collections: [] };
for (const p of dumpPaths) {
  const d = JSON.parse(readFileSync(p, 'utf8'));
  dump.collections.push(...(d.collections || []));
  if (!dump.textStyles?.length && d.textStyles?.length) dump.textStyles = d.textStyles;
}
const tokens = buildTokens(dump);

// Compare what a consumer can read: $type, $value, $description and every
// mode's value under $extensions.modes. (An earlier version stripped all of
// $extensions, so a Light-only change showed as "0 differences".)
function leaves(o, path = [], acc = {}) {
  if (o && typeof o === 'object' && '$value' in o) {
    acc[path.join('.')] = { $type: o.$type, $value: o.$value, $description: o.$description, modes: o.$extensions?.modes };
    return acc;
  }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!k.startsWith('$')) leaves(v, [...path, k], acc);
  return acc;
}
const show = (t) => t.modes ? JSON.stringify(t.modes) : JSON.stringify(t.$value);

let totalDiffs = 0;
for (const [name, obj] of Object.entries(tokens)) {
  const repoFile = join(REPO, name, `${name}.json`);
  const gen = leaves(obj);
  if (existsSync(repoFile)) {
    const cur = leaves(JSON.parse(readFileSync(repoFile, 'utf8')));
    const keys = new Set([...Object.keys(gen), ...Object.keys(cur)]);
    const diffs = [];
    for (const k of keys) {
      const a = cur[k], b = gen[k];
      if (!a) diffs.push(`  + ${k} = ${show(b)} (${b.$type})`);
      else if (!b) diffs.push(`  - ${k} (was ${show(a)})`);
      else if (JSON.stringify(a) !== JSON.stringify(b)) {
        const what = a.$description !== b.$description && show(a) === show(b) && a.$type === b.$type ? ' [description]' : '';
        diffs.push(`  ~ ${k}${what}: ${show(a)}(${a.$type}) -> ${show(b)}(${b.$type})`);
      }
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
