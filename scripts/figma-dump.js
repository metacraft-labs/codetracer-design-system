// figma-dump.js — GENERIC reflection payload, executed in the Figma file context
// via the Figma MCP `use_figma` tool. Returns every non-scratch variable
// collection with its modes and variables; aliases are resolved to slash-name
// refs and colors to hex. NO token names are hardcoded — pure reflection.
//
// The runner (export-tokens.mjs) may prepend `const ONLY = ["mapped"];` to scope
// the dump to one collection (keeps each MCP response under its size cap).
//
// Output shape (consumed by build-tokens.mjs):
//   { collections: [ { name, modes:[modeName,…],
//                      vars:[ { n, t:"COLOR|FLOAT|STRING|BOOLEAN",
//                               v:{ [modeName]: "#hex" | number | string | bool | {a:"slash/name"} } } ] } ] }

const EXCLUDE = /^zz-demo\//; // disposable/demo collections never export
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const only = (typeof ONLY !== 'undefined') ? new Set(ONLY) : null; // eslint-disable-line
const keep = cols.filter(c => !EXCLUDE.test(c.name) && (!only || only.has(c.name)));

// Resolve alias targets to names: index every kept variable once.
const byId = {};
for (const c of keep) for (const id of c.variableIds) byId[id] = await figma.variables.getVariableByIdAsync(id);
// Aliases may point at collections we're not dumping this pass; index those names too.
async function nameOf(id) {
  if (byId[id]) return byId[id].name;
  const v = await figma.variables.getVariableByIdAsync(id).catch(() => null);
  return v ? v.name : ('EXTERNAL:' + id);
}

const h = x => Math.round(x * 255).toString(16).padStart(2, '0');
const hex = c => { let s = '#' + h(c.r) + h(c.g) + h(c.b); if (c.a !== undefined && c.a < 1) s += h(c.a); return s; };

const out = { collections: [] };
for (const c of keep) {
  const vars = [];
  for (const id of c.variableIds) {
    const v = byId[id], vv = {};
    for (const m of c.modes) {
      const val = v.valuesByMode[m.modeId];
      if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') vv[m.name] = { a: await nameOf(val.id) };
      else vv[m.name] = (v.resolvedType === 'COLOR') ? hex(val) : val;
    }
    vars.push({ n: v.name, t: v.resolvedType, v: vv });
  }
  out.collections.push({ name: c.name, modes: c.modes.map(m => m.name), vars });
}

// Second pass: text styles → typography composites. Bound props (fontSize/
// fontStyle/lineHeight/fontFamily) are resolved to the variable NAME they
// reference, so build-tokens can emit `{ref}`s instead of raw numbers.
const tstyles = await figma.getLocalTextStylesAsync();
out.textStyles = [];
for (const s of tstyles) {
  const bound = {};
  for (const [k, r] of Object.entries(s.boundVariables || {})) bound[k] = await nameOf(r.id);
  out.textStyles.push({
    n: s.name, family: s.fontName.family, weight: s.fontName.style, size: s.fontSize,
    lineHeight: s.lineHeight, letterSpacing: s.letterSpacing,
    textCase: s.textCase, textDecoration: s.textDecoration, bound,
  });
}
return out;
