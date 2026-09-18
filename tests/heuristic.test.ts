import assert from "node:assert/strict";
import { test } from "node:test";
import { detections } from "../src/data/detections.ts";
import { triageAll, triageHeuristic } from "../src/lib/agent/index.ts";
import { lookalikeScore, levenshtein } from "../src/lib/agent/signals.ts";
import { brandById } from "../src/data/brands.ts";
import { buildEvalReport } from "../src/lib/eval.ts";

test("levenshtein treats identical strings as zero", () => {
  assert.equal(levenshtein("acmewallet", "acmewallet"), 0);
});

test("homoglyph host is a strong lookalike of Acme Wallet", () => {
  const score = lookalikeScore("acmewa11et.io", brandById["acme-wallet"]);
  assert.ok(score >= 0.85, `expected high lookalike, got ${score}`);
});

test("shared Acme drain cluster drafts APPROVE", () => {
  const cluster = detections.filter((item) => item.campaignId === "camp-acme-drain-sept");
  assert.equal(cluster.length, 5);
  for (const item of cluster) {
    const draft = triageHeuristic(item);
    assert.equal(draft.decision, "APPROVE");
    assert.equal(draft.dryRun, true);
    assert.equal(draft.signals.sharedDrain, true);
  }
});

test("allowlisted official docs draft REJECT", () => {
  const docs = detections.find((item) => item.id === "DET-2413");
  assert.ok(docs);
  const draft = triageHeuristic(docs);
  assert.equal(draft.decision, "REJECT");
  assert.equal(draft.signals.allowlisted, true);
});

test("queue triage never auto-executes", () => {
  for (const item of triageAll()) {
    assert.equal(item.draft.dryRun, true);
  }
});

test("eval stays above demo threshold", () => {
  const report = buildEvalReport();
  assert.ok(report.total >= 40);
  assert.ok(report.accuracy >= 0.85, `accuracy ${report.accuracy}`);
  assert.ok(report.approvePrecision >= 0.9, `precision ${report.approvePrecision}`);
});
