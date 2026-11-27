// Checks that this public repository cites no private planning material.
// Run: `node --test` (from the repo root), or `node scripts/run-tests.mjs`.
//
// This repository is public. Its documents may explain why a token or a
// divergence exists, but they must not send a reader to Metacraft's private
// project-management repositories: such a citation is a dead link for every
// outside reader and discloses internal planning. The rule is Metacraft's
// "Public Documentation Referencing Specifications" policy (§1: public
// repositories "must never contain links, file paths, or citations to
// private specification repositories").
//
// Every text file in the repository is scanned for three kinds of citation:
//   - a private repository name. Those repositories are named `<family>-pm`,
//     and were formerly named `<family>-specs` (plural); a public contract
//     specification is `<name>-spec` (singular) and is not matched;
//   - an internal milestone identifier of the `PLAT-<n>` series;
//   - an open-question number from a private spec (`OQ-<letters><n>`).
// The files are discovered rather than listed, so a document added later is
// checked without editing this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// Text formats the repository holds. Fonts and images are binary and carry
// no prose, so they are not scanned.
const textExtensions = new Set([
  '.md', '.txt', '.json', '.js', '.mjs', '.cjs', '.nim', '.nimble',
  '.yml', '.yaml', '.toml', '.css', '.html', '.sh',
]);

// Directories that are not repository content: git metadata, installed
// packages, and workspace-local tool state (ignored by .gitignore).
const skippedDirectories = new Set(['.git', 'node_modules', '.repro']);

const forbidden = [
  { what: 'a private repository name', re: /\b[A-Za-z][\w-]*-(?:pm|specs)\b/g },
  { what: 'an internal milestone identifier', re: /\bPLAT-\d+/g },
  { what: 'a private open-question number', re: /\bOQ-[A-Z]*\d+/g },
];

/** Lists every text file under `dir`, recursively. */
function textFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) out.push(...textFiles(path));
    } else if (entry.isFile() && textExtensions.has(extname(entry.name).toLowerCase())) {
      out.push(path);
    }
  }
  return out;
}

/** Returns `file:line: <match> (<kind>)` for every forbidden citation in `text`. */
export function findPrivateCitations(text, file = '<text>') {
  const hits = [];
  text.split('\n').forEach((line, i) => {
    for (const { what, re } of forbidden) {
      for (const m of line.matchAll(re)) hits.push(`${file}:${i + 1}: ${m[0]} (${what})`);
    }
  });
  return hits;
}

// The patterns themselves: each must catch the citations this test exists to
// stop, and must leave a public contract specification's name alone. Without
// this, a pattern that silently matched nothing would make the scan below pass
// vacuously. The samples are assembled at run time from a made-up family name,
// so this file holds no citation of its own for the scan to report.
test('the citation patterns match what they are meant to', () => {
  const pm = 'example' + '-pm';
  const specs = 'example' + '-specs';
  assert.equal(findPrivateCitations(`\`${pm}\`'s \`spec/GUI/Find.md\``).length, 1);
  assert.equal(findPrivateCitations(`\`${specs}/issues/x.md\``).length, 1);
  assert.equal(findPrivateCitations(`Example${'-pm'}`).length, 1);
  assert.equal(findPrivateCitations(`${'PLAT'}-47 met that`).length, 1);
  assert.equal(findPrivateCitations(`decision on ${'OQ'}-F6:`).length, 1);
  assert.deepEqual(findPrivateCitations('codetracer-trace-format-spec, a 3-pm meeting'), []);
});

test('the scan finds the repository documents', () => {
  const files = textFiles(root).map((f) => relative(root, f));
  assert.ok(files.includes(join('docs', 'DESIGN-DIVERGENCES.md')), 'docs/DESIGN-DIVERGENCES.md not scanned');
  assert.ok(files.includes('AGENTS.md'), 'AGENTS.md not scanned');
});

test('no file cites private planning material', () => {
  const hits = textFiles(root).flatMap((f) =>
    findPrivateCitations(readFileSync(f, 'utf8'), relative(root, f)));
  assert.deepEqual(hits, [], `private citations in a public repository:\n${hits.join('\n')}`);
});
