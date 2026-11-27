// Checks that the downstream lane exists, runs on what reaches `dev`, and
// cannot pass without checking its consumers.
// Run: `node --test` (from the repo root), or `node scripts/run-tests.mjs`.
//
// Every consumer of these tokens pins a revision of this repository, so a
// token change is checked against a consumer only when someone moves the pin.
// The downstream lane (scripts/downstream/consumers.lane.mjs, run by
// .github/workflows/downstream.yml) checks each consumer before the change
// reaches `dev`. These tests hold the parts of it that can fail silently:
//   - the workflow, its branch filters, its command and the consumers it
//     clones (a workflow that is not triggered, or that clones a different
//     set than the lane reads, reports nothing and fails nothing);
//   - the lane fails, and does not skip, when a consumer checkout is missing;
//   - the variable bookkeeping and check-token-refs.mjs, whose answers decide
//     whether a dropped token is noticed.
// The lane itself needs the consumers and is not run here. Nothing is mocked:
// the fixtures below are real files in a temporary directory, read by the
// real scripts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CONSUMERS, consumerDir, definedStylVariables, removedVariables, root,
} from './downstream/lane.mjs';

const workflowPath = join(root, '.github/workflows/downstream.yml');
const laneFile = 'scripts/downstream/consumers.lane.mjs';

/**
 * The lines of a top-level `on:` trigger block (`push:`, `pull_request:`)
 * of a workflow, without a YAML parser: the repository has no dependencies.
 */
function triggerBlock(yml, event) {
  const lines = yml.split('\n');
  const on = lines.findIndex((l) => /^on:\s*$/.test(l));
  assert.ok(on >= 0, 'the workflow has no top-level `on:` block');
  const start = lines.findIndex((l, i) => i > on && new RegExp(`^  ${event}:\\s*$`).test(l));
  if (start < 0) return null;
  const block = [];
  for (const l of lines.slice(start + 1)) {
    if (/^ {0,2}\S/.test(l)) break;
    block.push(l);
  }
  return block.join('\n');
}

test('the downstream workflow runs on pushes to dev and on pull requests into dev', () => {
  assert.ok(existsSync(workflowPath), '.github/workflows/downstream.yml does not exist: no downstream lane');
  const yml = readFileSync(workflowPath, 'utf8');
  for (const event of ['push', 'pull_request']) {
    const block = triggerBlock(yml, event);
    assert.ok(block !== null, `the workflow has no \`${event}\` trigger`);
    assert.match(block, /^\s+branches:\s*\[\s*dev\s*\]\s*$/m, `the \`${event}\` trigger does not name dev`);
  }
});

test('the downstream workflow runs the lane through the test runner', () => {
  const yml = readFileSync(workflowPath, 'utf8');
  assert.ok(existsSync(join(root, laneFile)), `${laneFile} does not exist`);
  assert.ok(yml.includes(`node scripts/run-tests.mjs ${laneFile}`),
    `the workflow does not run \`node scripts/run-tests.mjs ${laneFile}\``);
});

test('the downstream workflow clones every consumer the lane reads, where the lane reads it', () => {
  const yml = readFileSync(workflowPath, 'utf8');
  const cloned = [...yml.matchAll(/^\s+repo:\s*(\S+)\s*$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(cloned, CONSUMERS.map((c) => c.repo).sort(),
    'the repositories the workflow clones differ from CONSUMERS in scripts/downstream/lane.mjs');
  for (const c of CONSUMERS) {
    // The clone step for this consumer: its `repo:` line through the next step.
    const at = yml.indexOf(`repo: ${c.repo}\n`);
    const step = yml.slice(at, yml.indexOf('- name:', at));
    assert.match(step, new RegExp(`path: \\$\\{\\{ github\\.workspace \\}\\}/\\.\\./${c.name}\\s`),
      `${c.repo} is not cloned to ../${c.name}, where the lane looks for it`);
    assert.match(step, new RegExp(`\\|\\| '${c.ref}' \\}\\}`),
      `${c.repo} is not cloned at ${c.ref} by default`);
  }
});

test('a consumer checkout defaults to the workspace sibling and can be redirected', () => {
  for (const c of CONSUMERS) {
    assert.equal(consumerDir(c, {}), join(root, '..', c.name));
    assert.equal(consumerDir(c, { [c.env]: '/x/y' }), '/x/y');
  }
});

// Set in the nested run below. If run-tests.mjs ever stopped honouring its
// file argument, that run would be the whole default suite again, this test
// in it, and each level would start the next: a process chain that never
// ends. With the marker the nested copy of this test fails at once instead,
// so the outer assertions see passing tests and fail.
const nestedMarker = 'DS_DOWNSTREAM_LANE_SELF_TEST';

test('the lane fails every gate, and skips none, when the consumers are not checked out', () => {
  assert.ok(!process.env[nestedMarker],
    'run-tests.mjs ran the default suite instead of the lane file it was given');
  const missing = mkdtempSync(join(tmpdir(), 'ds-no-consumers-'));
  try {
    const env = { ...process.env, [nestedMarker]: '1' };
    // node --test marks its child processes with NODE_TEST_CONTEXT, and a
    // nested `node --test` that sees it runs no file; this run is separate.
    delete env.NODE_TEST_CONTEXT;
    for (const c of CONSUMERS) env[c.env] = join(missing, c.name);
    const r = spawnSync(process.execPath, ['scripts/run-tests.mjs', laneFile], {
      cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.notEqual(r.status, 0, 'the lane passed with no consumer checked out');
    const counts = /^TEST-COUNTS: executed=(\d+) passed=(\d+) failed=(\d+) skipped=(\d+)$/m.exec(r.stdout);
    assert.ok(counts, `the lane printed no TEST-COUNTS line:\n${r.stdout}\n${r.stderr}`);
    const [, executed, passed, failed, skipped] = counts.map(Number);
    assert.equal(passed, 0, 'a gate passed without its consumer');
    assert.equal(skipped, 0, 'a gate was skipped');
    assert.equal(failed, executed);
    assert.ok(executed >= CONSUMERS.length, `only ${executed} gate(s) ran for ${CONSUMERS.length} consumers`);
    for (const c of CONSUMERS) {
      assert.ok(r.stdout.includes(`${c.name}: no checkout at`), `no gate reported the missing ${c.name} checkout`);
    }
  } finally {
    rmSync(missing, { recursive: true, force: true });
  }
});

test('generated stylus definitions are read as variables, comments and uses are not', () => {
  // The shape codetracer's scripts/tokens-to-styl.sh writes.
  const text = [
    '// Auto-generated from mapped.json',
    '// Source layer: mapped',
    '',
    'colors-editor-action-primary = colors-brand-400',
    '',
    'colors-ui-surface-canvas=colors-neutral-cold-950',
    '  indented = 1',
    '.class { color: colors-editor-action-primary }',
  ].join('\n');
  assert.deepEqual([...definedStylVariables(text)].sort(),
    ['colors-editor-action-primary', 'colors-ui-surface-canvas']);
  assert.deepEqual(
    removedVariables(new Set(['a', 'c', 'b']), new Set(['b', 'd'])), ['a', 'c']);
});

/** Runs check-token-refs.mjs on a fixture tree. */
function checkRefs(args) {
  return spawnSync(process.execPath, [join(root, 'scripts/check-token-refs.mjs'), ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('check-token-refs.mjs fails on a stylesheet that uses a removed variable', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ds-refs-'));
  try {
    mkdirSync(join(dir, 'styles/generated'), { recursive: true });
    writeFileSync(join(dir, 'styles/panel.styl'), '.panel\n  background colors-ui-surface-canvas\n');
    // A definition in generated/ is not a use, and is not scanned.
    writeFileSync(join(dir, 'styles/generated/mapped.styl'), 'colors-ui-surface-gone = #000\n');
    const list = join(dir, 'removed.txt');

    writeFileSync(list, 'colors-ui-surface-canvas\n');
    let r = checkRefs(['--removed', `@${list}`, '--src', join(dir, 'styles')]);
    assert.equal(r.status, 1, `a removed variable in use was not reported:\n${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /panel\.styl:2: colors-ui-surface-canvas/);

    writeFileSync(list, 'colors-ui-surface-gone\n');
    r = checkRefs(['--removed', `@${list}`, '--src', join(dir, 'styles')]);
    assert.equal(r.status, 0, `an unused removed variable was reported:\n${r.stdout}${r.stderr}`);

    // An empty list is what the lane passes for a candidate that drops nothing.
    writeFileSync(list, '');
    r = checkRefs(['--removed', `@${list}`, '--src', join(dir, 'styles')]);
    assert.equal(r.status, 0, `an empty removed list was refused:\n${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /no token removed; 1 stylesheet/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('check-token-refs.mjs refuses a scan that would check nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ds-refs-'));
  try {
    let r = checkRefs(['--removed', 'x', '--src', join(dir, 'absent')]);
    assert.equal(r.status, 2, 'a missing --src root passed');
    r = checkRefs(['--removed', 'x', '--src', dir]);
    assert.equal(r.status, 2, 'a --src root with no stylesheet passed');
    r = checkRefs(['--src', dir]);
    assert.equal(r.status, 2, 'a run without --removed passed');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
