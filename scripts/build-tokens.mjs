// build-tokens.mjs — PURE transform: a generic Figma-variables dump → DTCG token
// objects. No token names are hardcoded; everything is driven by the conventions
// in TOKEN-EXPORT-CONVENTIONS.md. Unit-testable with fixtures (no Figma/MCP dep).
//
// Input dump shape (produced by figma-dump.js via the Figma MCP `use_figma`):
//   { collections: [ { name, modes:[modeName,…],
//                      vars:[ { n:"a/b/c", t:"COLOR|FLOAT|STRING|BOOLEAN",
//                               v:{ [modeName]: <value> } } ] } ] }
//   value = "#rrggbb[aa]" (color) | number | string | boolean | { a:"slash/name" } (alias)
//
// Mode policy = "A" (see conventions): default mode flat in `$value`; if a
// collection has >1 mode, all modes are also recorded under
// `$extensions.modes.<modeName>` so theme-aware consumers can read them while
// today's single-value consumers keep working. Swap policyA→policyB in one place.

// --- config (the only things that ever change; all name-driven, never per-token) ---

// $type is the Figma resolvedType, mapped 1:1 to its DTCG base type. Figma only
// knows these four, and Tokens Studio exports variables using exactly this
// mapping (a FLOAT `type/fontSize/*` token exports as `number`, a STRING
// `type/fontFamily/*` as `text` — verified against the canonical alias.json).
// We deliberately do NOT "refine" types from the token's name: that would make
// the reflection diverge from what Tokens Studio produces from the same
// variables, breaking the faithful-mirror guarantee. Richer DTCG composites
// (`typography`, `fontSizes`, …) exist only as Tokens-Studio-authored tokens
// that have no Figma-variable backing — they're outside variable reflection
// (see the typography boundary in TOKEN-EXPORT-CONVENTIONS.md).
const BASE_TYPE = { COLOR: 'color', FLOAT: 'number', STRING: 'text', BOOLEAN: 'boolean' };

function dtcgType(name, resolvedType) {
  return BASE_TYPE[resolvedType] || 'text';
}

// A Figma alias { a:"colors/grey/50" } → DTCG reference "{colors.grey.50}".
function fmtValue(val) {
  if (val && typeof val === 'object' && 'a' in val) return '{' + val.a.replaceAll('/', '.') + '}';
  return val; // hex string | number | string | boolean
}

function setDeep(root, path, leaf) {
  let node = root;
  for (let i = 0; i < path.length - 1; i++) node = (node[path[i]] ??= {});
  node[path[path.length - 1]] = leaf;
}

function buildCollection(col) {
  const root = {};
  const defaultMode = col.modes[0];
  const multi = col.modes.length > 1;
  for (const v of col.vars) {
    const leaf = { $type: dtcgType(v.n, v.t), $value: fmtValue(v.v[defaultMode]) };
    if (multi) {
      leaf.$extensions = { modes: {} };
      for (const m of col.modes) leaf.$extensions.modes[m] = fmtValue(v.v[m]);
    }
    setDeep(root, v.n.split('/'), leaf);
  }
  return root;
}

// ── Second pass: text styles → DTCG `typography` composite tokens ────────────
// A "typography composite" bundles the properties that define a text style:
// fontFamily, fontWeight, fontSize, lineHeight, letterSpacing. Where a property
// is bound to a variable in Figma, we emit a `{ref}` to that token (so the
// composite stays DRY against the type/scale system); otherwise the literal value.
const ref = (name) => '{' + name.replaceAll('/', '.') + '}';
function typographyValue(s) {
  const b = s.bound || {};
  const lh = b.lineHeight ? ref(b.lineHeight)
           : (s.lineHeight?.unit === 'AUTO' ? 'AUTO' : s.lineHeight?.value);
  const ls = b.letterSpacing ? ref(b.letterSpacing) : (s.letterSpacing?.value ?? 0);
  return {
    fontFamily:    b.fontFamily ? ref(b.fontFamily) : s.family,
    fontWeight:    b.fontStyle  ? ref(b.fontStyle)  : s.weight,
    fontSize:      b.fontSize   ? ref(b.fontSize)   : s.size,
    lineHeight:    lh,
    letterSpacing: ls,
  };
}
export function buildTypography(textStyles) {
  const root = {};
  for (const s of textStyles) {
    const leaf = { $type: 'typography', $value: typographyValue(s) };
    if (s.textCase && s.textCase !== 'ORIGINAL') (leaf.$extensions ??= {}).textCase = s.textCase;
    setDeep(root, s.n.split('/'), leaf);
  }
  return root;
}

/** dump → { [collectionName]: DTCG object }. Pure; no I/O. */
export function buildTokens(dump) {
  const out = {};
  for (const col of dump.collections) out[col.name] = buildCollection(col);
  if (dump.textStyles?.length) out.typography = buildTypography(dump.textStyles);
  return out;
}

// --- CLI: `node build-tokens.mjs <dump.json> <outDir>` writes <col>/<col>.json ---
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync, writeFileSync, mkdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  const [dumpPath, outDir = 'scratch-tokens'] = process.argv.slice(2);
  if (!dumpPath) { console.error('usage: node build-tokens.mjs <dump.json> [outDir]'); process.exit(1); }
  const dump = JSON.parse(readFileSync(dumpPath, 'utf8'));
  const tokens = buildTokens(dump);
  for (const [name, obj] of Object.entries(tokens)) {
    mkdirSync(join(outDir, name), { recursive: true });
    writeFileSync(join(outDir, name, `${name}.json`), JSON.stringify(obj, null, 2) + '\n');
    console.log(`wrote ${join(outDir, name, name + '.json')}`);
  }
}
