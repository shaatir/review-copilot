import { triageAll } from "@/lib/agent";
import type { Decision, EvalCell, EvalReport } from "@/lib/types";

const DECISIONS: Decision[] = ["APPROVE", "REJECT", "WATCHLIST"];

export function buildEvalReport(): EvalReport {
  const rows = triageAll();
  const confusion: EvalCell[] = [];
  for (const golden of DECISIONS) {
    for (const draft of DECISIONS) {
      confusion.push({
        golden,
        draft,
        count: rows.filter(
          (row) => row.goldenLabel === golden && row.draft.decision === draft,
        ).length,
      });
    }
  }

  const total = rows.length;
  const correct = rows.filter((row) => row.draft.decision === row.goldenLabel).length;
  const tp = rows.filter(
    (row) => row.goldenLabel === "APPROVE" && row.draft.decision === "APPROVE",
  ).length;
  const fp = rows.filter(
    (row) => row.goldenLabel !== "APPROVE" && row.draft.decision === "APPROVE",
  ).length;
  const fn = rows.filter(
    (row) => row.goldenLabel === "APPROVE" && row.draft.decision !== "APPROVE",
  ).length;

  const approvePrecision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const approveRecall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const approveF1 =
    approvePrecision + approveRecall === 0
      ? 0
      : (2 * approvePrecision * approveRecall) /
        (approvePrecision + approveRecall);

  const brandIds = [...new Set(rows.map((row) => row.brand.id))];
  const byBrand: EvalReport["byBrand"] = {};
  for (const brandId of brandIds) {
    const subset = rows.filter((row) => row.brand.id === brandId);
    const brandTp = subset.filter(
      (row) => row.goldenLabel === "APPROVE" && row.draft.decision === "APPROVE",
    ).length;
    const brandFp = subset.filter(
      (row) => row.goldenLabel !== "APPROVE" && row.draft.decision === "APPROVE",
    ).length;
    byBrand[subset[0].brand.name] = {
      total: subset.length,
      accuracy:
        subset.filter((row) => row.draft.decision === row.goldenLabel).length /
        subset.length,
      approvePrecision: brandTp + brandFp === 0 ? 1 : brandTp / (brandTp + brandFp),
    };
  }

  return {
    total,
    accuracy: correct / total,
    approvePrecision,
    approveRecall,
    approveF1,
    byBrand,
    confusion,
    mismatches: rows
      .filter((row) => row.draft.decision !== row.goldenLabel)
      .map((row) => ({
        id: row.id,
        brand: row.brand.name,
        domain: row.suspicious.domain,
        golden: row.goldenLabel,
        draft: row.draft.decision,
        confidence: row.draft.confidence,
      })),
    scorer: rows[0]?.draft.scorer ?? "heuristic",
  };
}
