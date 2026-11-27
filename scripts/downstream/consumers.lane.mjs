// consumers.lane.mjs — the downstream lane: each consumer's token gates, run
// against a candidate revision of this repository.
//
// Run: `node scripts/run-tests.mjs scripts/downstream/consumers.lane.mjs`
//      (from anywhere). CI runs it in .github/workflows/downstream.yml.
//
// Inputs (all optional):
//   DS_DOWNSTREAM_CANDIDATE      the revision to check (default: HEAD)
//   DS_DOWNSTREAM_CODETRACER     codetracer checkout       (default: ../codetracer)
//   DS_DOWNSTREAM_CODETRACER_CI  codetracer-ci checkout    (default: ../codetracer-ci)
//   DS_DOWNSTREAM_WEB_SITE       codetracer-web-site checkout
//                                                  (default: ../codetracer-web-site)
// Each consumer is measured at the commit its checkout has checked out, in a
// scratch copy; the checkouts themselves are not modified.
//
// Needs git, bash, python3 and `just` on PATH (codetracer's generator and
// gate are bash + python3, its regeneration recipe is in its justfile), and
// `nix` for the web site, whose test runs in its flake's `ci` dev shell. A
// missing tool or checkout fails the gate that needs it: nothing here skips,
// because a lane that skips to green says nothing about the consumers.
//
// The file name stays outside `node --test`'s default discovery patterns
// (`*.test.mjs`, …), so the repository's own suite (`node scripts/run-tests.mjs`)
// does not run it: that suite needs nothing but Node.js, and this one needs
// the consumers.
//
// Nothing is mocked. Every gate is the consumer's own command on the
// consumer's own committed sources; only the design-system revision under it
// is replaced by the candidate.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CANDIDATE_ENV, checkoutCommit, consumer, consumerCommit, definedStylVariables,
  git, removedVariables, root, run, tail,
} from './lane.mjs';

const scratch = mkdtempSync(join(tmpdir(), 'ds-downstream-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

// The candidate, resolved and checked out once, on first use, so a lane run
// whose consumers are all missing still reports each of them.
let candidateMemo;
function candidate() {
  if (!candidateMemo) {
    const rev = process.env[CANDIDATE_ENV] || 'HEAD';
    const sha = git(['rev-parse', '--verify', `${rev}^{commit}`], root);
    const dir = checkoutCommit(root, sha, join(scratch, 'codetracer-design-system'));
    console.log(`# candidate: codetracer-design-system ${sha} (${rev})`);
    candidateMemo = { sha, dir };
  }
  return candidateMemo;
}

/** Every generated stylus file of a codetracer tree, by file name. */
function generatedStyl(dir) {
  const files = new Map();
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.styl')) files.set(name, readFileSync(join(dir, name), 'utf8'));
  }
  return files;
}

function definedIn(files) {
  const names = new Set();
  for (const text of files.values()) for (const n of definedStylVariables(text)) names.add(n);
  return names;
}

// ── codetracer ──────────────────────────────────────────────────────────────
// codetracer pins this repository as the submodule libs/codetracer-design-system
// and generates its desktop stylus and its terminal token module from it with
// `just sync-design-tokens`. ci/test/design-tokens-fresh.sh is its gate: it
// regenerates both from the revision the index pins and diffs them against the
// tree. The three gates below move that pin to the candidate in a scratch copy,
// as a developer bumping it would, and run codetracer's own commands.
const ctGenerated = 'src/frontend/styles/generated';
let ct; // shared by the three codetracer gates, set by the first

test('codetracer: `just sync-design-tokens` regenerates its token outputs from the candidate', () => {
  const c = consumer('codetracer');
  const { dir, sha } = consumerCommit(c);
  const cand = candidate();
  console.log(`# codetracer ${sha} (${dir})`);
  const tree = checkoutCommit(dir, sha, join(scratch, 'codetracer'), {
    // What the regeneration and the gate read: the generator, the gate, the
    // stylesheets and the Monaco theme documents. Cone mode adds the
    // top-level files (justfile, .gitmodules).
    sparse: [
      'scripts', 'ci/test', 'src/frontend/styles',
      'src/public/third_party/monaco-themes/themes/customThemes/json',
    ],
  });
  const committed = generatedStyl(join(tree, ctGenerated));
  assert.ok(committed.size > 0, `codetracer ${sha} commits no ${ctGenerated}/*.styl`);

  // The candidate goes where the submodule lives, checked out at its commit,
  // and the index gitlink is moved to it: the state `git add` leaves after a
  // pin bump, which is what the freshness gate reads.
  const sub = 'libs/codetracer-design-system';
  rmSync(join(tree, sub), { recursive: true, force: true });
  mkdirSync(join(tree, 'libs'), { recursive: true });
  checkoutCommit(root, cand.sha, join(tree, sub));
  git(['update-index', '--cacheinfo', `160000,${cand.sha},${sub}`], tree);

  const r = run('just', ['sync-design-tokens'], { cwd: tree });
  assert.equal(r.status, 0, `just sync-design-tokens failed:\n${tail(r)}`);
  const regenerated = generatedStyl(join(tree, ctGenerated));
  assert.ok(regenerated.size > 0, `just sync-design-tokens wrote no ${ctGenerated}/*.styl`);

  const changed = [...new Set([...committed.keys(), ...regenerated.keys()])]
    .filter((n) => committed.get(n) !== regenerated.get(n));
  console.log(`# codetracer: ${changed.length} generated stylus file(s) change: ${changed.join(', ') || 'none'}`);
  ct = { tree, committed, regenerated };
});

test('codetracer: ci/test/design-tokens-fresh.sh passes with the candidate as the pin', () => {
  assert.ok(ct, 'the regeneration gate did not complete, so there is nothing to check');
  const r = run('bash', ['ci/test/design-tokens-fresh.sh'], { cwd: ct.tree });
  assert.equal(r.status, 0, `design-tokens-fresh.sh failed:\n${tail(r)}`);
  console.log(`# ${tail(r, 2).replace(/\n/g, '\n# ')}`);
});

test('codetracer: check-token-refs.mjs finds no stylesheet using a variable the candidate drops', () => {
  assert.ok(ct, 'the regeneration gate did not complete, so there is nothing to check');
  // The variables codetracer's stylesheets are written against are the ones
  // its committed generated files define; a variable the candidate no longer
  // generates breaks every stylesheet that still names it.
  const before = definedIn(ct.committed);
  const afterBump = definedIn(ct.regenerated);
  assert.ok(before.size > 0 && afterBump.size > 0,
    `no variable definitions found (committed ${before.size}, regenerated ${afterBump.size})`);
  const removed = removedVariables(before, afterBump);
  const list = join(scratch, 'codetracer-removed-variables.txt');
  writeFileSync(list, removed.join('\n'));
  console.log(`# codetracer: the candidate drops ${removed.length} of ${before.size} generated variable(s)` +
    (removed.length ? `: ${removed.join(', ')}` : ''));
  const r = run(process.execPath, [
    join(root, 'scripts/check-token-refs.mjs'),
    '--removed', `@${list}`, '--src', 'src/frontend/styles',
  ], { cwd: ct.tree }); // relative, so a hit reads as codetracer's own path
  assert.equal(r.status, 0, `check-token-refs.mjs failed:\n${tail(r)}`);
  console.log(`# ${tail(r, 1)}`);
});

// ── codetracer-ci ───────────────────────────────────────────────────────────
// codetracer-ci's WebUI tokens come from scripts/generate-design-tokens.py and
// its facade map scripts/design-tokens.map.json. `--check` resolves every
// mapped token through the candidate and exits non-zero on an unresolved one.
test('codetracer-ci: generate-design-tokens.py --check resolves every mapped token', () => {
  const c = consumer('codetracer-ci');
  const { dir, sha } = consumerCommit(c);
  const cand = candidate();
  console.log(`# codetracer-ci ${sha} (${dir})`);
  const tree = checkoutCommit(dir, sha, join(scratch, 'codetracer-ci'), { sparse: ['scripts'] });
  const r = run('python3', ['scripts/generate-design-tokens.py', '--ds', cand.dir, '--check'], { cwd: tree });
  assert.equal(r.status, 0, `generate-design-tokens.py --check failed:\n${tail(r)}`);
  assert.match(r.stdout, /All references resolved\./,
    `generate-design-tokens.py --check exited 0 without reporting its references resolved:\n${tail(r)}`);
});

// ── codetracer-web-site ─────────────────────────────────────────────────────
// The web site reads the tokens at build time from DESIGN_SYSTEM_SRC
// (src/design_system/tokens.nim, which raises on an unknown token), and its
// `just test` builds the real static exporter and asserts the token layer
// resolved into the emitted CSS. Its flake pins the design system as an
// input and exports DESIGN_SYSTEM_SRC from it; the gate overrides that one
// variable inside the flake's `ci` dev shell.
test('codetracer-web-site: `just test` builds the site from the candidate', () => {
  const c = consumer('codetracer-web-site');
  const { dir, sha } = consumerCommit(c);
  const cand = candidate();
  console.log(`# codetracer-web-site ${sha} (${dir})`);
  const tree = checkoutCommit(dir, sha, join(scratch, 'codetracer-web-site'));
  const r = run('nix', [
    'develop', `${tree}#ci`, '--command', 'bash', '-c',
    'export DESIGN_SYSTEM_SRC="$1"; exec just test', 'design-system-candidate', cand.dir,
  ], { cwd: tree });
  assert.equal(r.status, 0, `just test failed:\n${tail(r)}`);
});
