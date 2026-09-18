import { buildEvalReport } from "../src/lib/eval.ts";

const report = buildEvalReport();
console.log(
  JSON.stringify(
    {
      total: report.total,
      accuracy: Number(report.accuracy.toFixed(3)),
      approvePrecision: Number(report.approvePrecision.toFixed(3)),
      approveRecall: Number(report.approveRecall.toFixed(3)),
      approveF1: Number(report.approveF1.toFixed(3)),
      mismatches: report.mismatches,
      byBrand: report.byBrand,
    },
    null,
    2,
  ),
);

if (report.accuracy < 0.85 || report.approvePrecision < 0.9) {
  console.error("Eval below expected demo threshold.");
  process.exit(1);
}
