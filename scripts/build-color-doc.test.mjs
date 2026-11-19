// The colour guide is generated from the tokens; fail when it is stale.
// Run: `node --test scripts/`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildColorDoc, resolver } from './build-color-doc.mjs';

test('docs/foundations/color.md matches the tokens (re-run build-color-doc.mjs)', () => {
  const cur = readFileSync(new URL('../docs/foundations/color.md', import.meta.url), 'utf8');
  assert.equal(cur, buildColorDoc());
});

test('references resolve downward, even through a same-named lower token', () => {
  const mapped = { c: { a: { $type: 'color', $value: '{c.b}', $extensions: { modes: { Dark: '{c.b}', Light: '{c.w}' } } } } };
  const alias = { c: { b: { $type: 'color', $value: '{c.x}' }, w: { $type: 'color', $value: '{c.w}' } } };
  const brand = { c: { x: { $type: 'color', $value: '#111111' }, w: { $type: 'color', $value: '#ffffff' } } };
  const r = resolver(mapped, alias, brand);
  assert.equal(r('{c.a}', 'Dark'), '#111111');
  assert.equal(r('{c.a}', 'Light'), '#ffffff');
});
