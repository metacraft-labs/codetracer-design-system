// Fixture tests for the pure dump→DTCG transform. Run: `node --test scripts/`
// Exercises every convention in TOKEN-EXPORT-CONVENTIONS.md so a change to the
// transform that breaks a convention fails here instead of in a live export.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTokens, buildTypography } from './build-tokens.mjs';

const dump = {
  collections: [
    {
      name: 'mapped',
      modes: ['Dark', 'Light'],
      vars: [
        { n: 'colors/ui/surface/base/canvas', t: 'COLOR', v: { Dark: { a: 'colors/neutral/900' }, Light: { a: 'colors/neutral/50' } } },
        { n: 'colors/ui/text/primary/body', t: 'COLOR', v: { Dark: '#f5f5f5', Light: '#111111' } },
        { n: 'type/ui/size/body', t: 'FLOAT', v: { Dark: { a: 'scale/300' }, Light: { a: 'scale/300' } } },
        { n: 'type/ui/fontFamily/ui', t: 'STRING', v: { Dark: 'Space Grotesk', Light: 'Space Grotesk' } },
        { n: 'flags/experimental', t: 'BOOLEAN', v: { Dark: true, Light: true } },
      ],
    },
    {
      name: 'brand',
      modes: ['Label'],
      vars: [
        { n: 'colors/neutral/900', t: 'COLOR', v: { Label: '#0a0a0a' } },
        { n: 'colors/overlay/scrim', t: 'COLOR', v: { Label: '#00000080' } },
      ],
    },
  ],
  textStyles: [
    {
      n: 'header/heading-md', family: 'Space Grotesk', weight: 'Medium', size: 16,
      lineHeight: { unit: 'PIXELS', value: 24 }, letterSpacing: { value: 0 },
      bound: { fontSize: 'type/ui/size/heading-md', lineHeight: 'type/ui/lineHeight/heading-md' },
    },
    {
      n: 'body/caption', family: 'Space Grotesk', weight: 'Regular', size: 12,
      lineHeight: { unit: 'AUTO' }, letterSpacing: { value: 0.2 }, textCase: 'UPPER',
      bound: {},
    },
  ],
};

const out = buildTokens(dump);

test('collections become top-level token objects', () => {
  assert.deepEqual(Object.keys(out).sort(), ['brand', 'mapped', 'typography']);
});

test('slash names nest into DTCG groups', () => {
  assert.ok(out.mapped.colors.ui.surface.base.canvas);
  assert.ok(out.mapped.colors.ui.text.primary.body);
});

test('aliases emit dotted {refs}, colors emit hex, booleans pass through', () => {
  assert.equal(out.mapped.colors.ui.surface.base.canvas.$value, '{colors.neutral.900}');
  assert.equal(out.mapped.colors.ui.text.primary.body.$value, '#f5f5f5');
  assert.equal(out.brand.colors.overlay.scrim.$value, '#00000080'); // alpha preserved
  assert.equal(out.mapped.flags.experimental.$value, true);
});

test('$type mirrors the Figma resolvedType 1:1 (no name-based refinement)', () => {
  // Matches Tokens Studio's export: a FLOAT type/*/size token is `number`,
  // a STRING type/*/fontFamily token is `text` — NOT `fontSize`/`fontFamily`.
  assert.equal(out.mapped.type.ui.size.body.$type, 'number');
  assert.equal(out.mapped.type.ui.fontFamily.ui.$type, 'text');
  assert.equal(out.mapped.colors.ui.text.primary.body.$type, 'color');
  assert.equal(out.mapped.flags.experimental.$type, 'boolean');
});

test('mode policy A: default mode flat, all modes under $extensions.modes', () => {
  const c = out.mapped.colors.ui.surface.base.canvas;
  assert.equal(c.$value, '{colors.neutral.900}');             // Dark (first) is flat
  assert.equal(c.$extensions.modes.Light, '{colors.neutral.50}');
  assert.equal(c.$extensions.modes.Dark, '{colors.neutral.900}');
});

test('single-mode collections carry no $extensions.modes', () => {
  assert.equal(out.brand.colors.neutral['900'].$extensions, undefined);
});

test('typography composites reference bound vars, else literal', () => {
  const h = out.typography.header['heading-md'];
  assert.equal(h.$type, 'typography');
  assert.equal(h.$value.fontSize, '{type.ui.size.heading-md}');   // bound → ref
  assert.equal(h.$value.lineHeight, '{type.ui.lineHeight.heading-md}');
  assert.equal(h.$value.fontFamily, 'Space Grotesk');             // unbound → literal
  assert.equal(h.$value.fontWeight, 'Medium');
});

test('typography AUTO line-height + textCase extension', () => {
  const cap = out.typography.body.caption;
  assert.equal(cap.$value.lineHeight, 'AUTO');
  assert.equal(cap.$value.letterSpacing, 0.2);
  assert.equal(cap.$extensions.textCase, 'UPPER');
});

test('buildTypography is independently exported', () => {
  assert.equal(typeof buildTypography, 'function');
  assert.ok(buildTypography(dump.textStyles).header['heading-md']);
});
