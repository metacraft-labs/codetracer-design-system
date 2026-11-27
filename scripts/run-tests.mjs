// run-tests.mjs — run every `*.test.mjs` in the repository and print totals.
//
// Run: `node scripts/run-tests.mjs` (from anywhere; it runs from the repo root)
//      `node scripts/run-tests.mjs <file>…` runs only the named test files
//      (relative to the current directory), with the same reporters and exit
//      rules; the downstream lane is run this way
//      (`node scripts/run-tests.mjs scripts/downstream/consumers.lane.mjs`).
//
// This is the command CI runs, so a failure reproduces locally with the same
// command. It is `node --test` from the repository root — the runner's own
// file discovery, so exactly the set `node --test` runs — with the spec
// reporter plus scripts/report-test-counts.mjs, which closes the log with a
// `TEST-COUNTS: executed=N passed=N failed=N skipped=N` line.
//
// The exit status is the runner's (non-zero when any test failed or a test
// file failed to load), and also non-zero when no test executed: a run that
// discovered nothing is not a passing run.
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// Named files are resolved against the caller's directory, because the runner
// runs from the repository root. A flag is refused rather than passed on: this
// command's contract is the reporters and the exit rules below, and a
// `node --test` option could change either.
const files = process.argv.slice(2);
const flag = files.find((f) => f.startsWith('-'));
if (flag) {
  console.error(`run-tests: unknown option ${flag} (usage: run-tests.mjs [test-file…])`);
  process.exit(2);
}

// Spawned rather than driven through node:test's in-process run(): on
// Node.js 24.14.1 that API exited silently with status 1. The output is
// streamed through as it arrives, so a CI log shows progress and a large
// failure diff is never truncated by a buffer limit; only the last chunk
// boundary is kept to find the TEST-COUNTS line.
const child = spawn(process.execPath, [
  '--test',
  '--test-reporter=spec', '--test-reporter-destination=stdout',
  '--test-reporter=./scripts/report-test-counts.mjs', '--test-reporter-destination=stdout',
  ...files.map((f) => resolve(f)),
], { cwd: root, stdio: ['inherit', 'pipe', 'inherit'] });

let executed = null;
let pending = '';
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  const lines = (pending + chunk).split('\n');
  pending = lines.pop();
  for (const line of lines) {
    const m = /^TEST-COUNTS: executed=(\d+) /.exec(line);
    if (m) executed = Number(m[1]);
  }
});

child.on('error', (err) => {
  console.error(`run-tests: cannot start ${process.execPath}: ${err.message}`);
  process.exitCode = 1;
});

child.on('close', (status, signal) => {
  const m = /^TEST-COUNTS: executed=(\d+) /.exec(pending);
  if (m) executed = Number(m[1]);
  if (status !== 0) {
    if (signal) console.error(`run-tests: node --test was killed by ${signal}`);
    process.exitCode = status || 1;
  } else if (!executed) {
    console.error('run-tests: no test executed');
    process.exitCode = 1;
  }
});
