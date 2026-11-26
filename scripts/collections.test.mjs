// Checks every committed DTCG collection. Run: `node --test` (from the repo root)
//
// A collection is the file the export pipeline writes for one Figma variable
// collection: `<name>/<name>.json` at the repository root (brand, alias,
// mapped, space). Each one is checked with the same normalisation
// validate-collection.mjs uses for Figma parity, so a collection that no
// longer parses, or that normalises to zero tokens (an export that wrote an
// empty or mis-shaped file), fails here instead of in a consumer.
//
// The collections are discovered rather than listed, so a collection added in
// Figma is checked without editing this file (TOKEN-EXPORT-CONVENTIONS.md: a
// new collection needs no script edits). The ones AGENTS.md documents are
// also required by name, so deleting or renaming one of them fails too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarize } from './validate-collection.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const documented = ['brand', 'alias', 'mapped', 'space'];

const discovered = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  .map((e) => e.name)
  .filter((name) => existsSync(join(root, name, `${name}.json`)))
  .sort();

test('every documented collection is committed', () => {
  for (const name of documented) {
    assert.ok(discovered.includes(name), `missing collection ${name}/${name}.json`);
  }
});

for (const name of discovered) {
  test(`collection ${name}/${name}.json parses and holds tokens`, () => {
    const { count, len, hash } = summarize(join(root, name, `${name}.json`));
    assert.ok(count > 0, `${name}/${name}.json normalises to no tokens`);
    assert.ok(len > 0);
    assert.equal(typeof hash, 'number');
  });
}
