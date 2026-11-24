import { runAllMathTests } from './mathTests';

const results = runAllMathTests();
let failed = 0;

for (const t of results) {
  const mark = t.passed ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${t.id}: ${t.name}`);
  console.log(`       Expected: ${t.expected}`);
  console.log(`       Actual:   ${t.actual}`);
  if (!t.passed) failed++;
}

console.log(`\nSummary: ${results.length - failed}/${results.length} mathematical tests passed.`);
if (failed > 0) {
  process.exit(1);
}
