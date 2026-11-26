// report-test-counts.mjs — a `node --test` reporter that prints one totals
// line when the run ends, in the counter form CI log audits read:
//
//   TEST-COUNTS: executed=N passed=N failed=N skipped=N
//
// executed = passed + failed; a skipped or todo test counts as skipped only.
// Suites (`describe` blocks) are not counted, since they report pass/fail as
// well. A test file that fails to load is reported by the runner as a failed
// test named after the file, so it counts as failed.
//
// Its name must stay outside the runner's default discovery patterns
// (`test-*.mjs`, `*.test.mjs`, `*-test.mjs`, …), or `node --test` would load it
// as a test file and count it. scripts/run-tests.mjs uses it alongside the
// spec reporter; on its own:
//   node --test --test-reporter=./scripts/report-test-counts.mjs
//
// Custom reporters: https://nodejs.org/api/test.html#custom-reporters
// Reporter events:  https://nodejs.org/api/test.html#event-testpass
export default async function* testCountsReporter(source) {
  const totals = { passed: 0, failed: 0, skipped: 0 };
  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    const { details, skip, todo } = event.data;
    if (details?.type === 'suite') continue;
    if (skip !== undefined || todo !== undefined) totals.skipped++;
    else if (event.type === 'test:pass') totals.passed++;
    else totals.failed++;
  }
  const executed = totals.passed + totals.failed;
  yield `TEST-COUNTS: executed=${executed} passed=${totals.passed} ` +
    `failed=${totals.failed} skipped=${totals.skipped}\n`;
}
