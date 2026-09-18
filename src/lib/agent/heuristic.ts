import { knownMaliciousKits } from "@/lib/agent/signals";
import type {
  AgentSignals,
  Decision,
  Detection,
  DraftDecision,
  EvidenceItem,
} from "@/lib/types";

const WEIGHTS = {
  lookalike: 0.2,
  whois: 0.1,
  kit: 0.18,
  visual: 0.1,
  drain: 0.2,
  homoglyph: 0.07,
  campaign: 0.08,
  copy: 0.07,
};

export function scoreSignals(signals: AgentSignals): number {
  const kitHit =
    signals.htmlKitFingerprint &&
    knownMaliciousKits().has(signals.htmlKitFingerprint)
      ? 1
      : 0;
  const campaignHit = signals.campaignSize >= 3 ? 1 : signals.campaignSize >= 2 ? 0.6 : 0;

  let score =
    WEIGHTS.lookalike * signals.lookalikeScore +
    WEIGHTS.whois * signals.whoisRisk +
    WEIGHTS.kit * kitHit +
    WEIGHTS.visual * signals.visualSimilarity +
    WEIGHTS.drain * (signals.sharedDrain ? 1 : 0) +
    WEIGHTS.homoglyph * (signals.homoglyph ? 1 : 0) +
    WEIGHTS.campaign * campaignHit +
    WEIGHTS.copy * (signals.impersonationCopy ? 1 : 0);

  if (signals.allowlisted) {
    score -= 0.72;
  }

  return clamp(score, 0, 1);
}

export function decide(score: number, signals: AgentSignals): Decision {
  if (signals.allowlisted) {
    return "REJECT";
  }

  const kitHit = Boolean(signals.htmlKitFingerprint);
  const strongMalice =
    signals.sharedDrain ||
    (kitHit && signals.lookalikeScore >= 0.5) ||
    (signals.homoglyph && signals.whoisRisk >= 0.75) ||
    (signals.lookalikeScore >= 0.68 &&
      (signals.whoisRisk >= 0.75 ||
        signals.visualSimilarity >= 0.7 ||
        signals.impersonationCopy));

  if (score >= 0.62 || strongMalice) {
    return "APPROVE";
  }

  const brandAdjacent = signals.lookalikeScore >= 0.45 || signals.homoglyph;
  if (brandAdjacent) {
    return "WATCHLIST";
  }

  if (score <= 0.32) return "REJECT";
  return "WATCHLIST";
}

export function confidenceFor(
  decision: Decision,
  score: number,
  evidence: EvidenceItem[],
): number {
  const support = evidence.filter((item) => item.present).length;
  const coverage = evidence.length === 0 ? 0 : support / evidence.length;
  const polarity =
    decision === "APPROVE"
      ? score
      : decision === "REJECT"
        ? 1 - score
        : 1 - Math.abs(score - 0.47) * 1.4;
  return clamp(0.52 * polarity + 0.38 * coverage + 0.1, 0.45, 0.97);
}

export function buildEvidence(
  detection: Detection,
  signals: AgentSignals,
): EvidenceItem[] {
  const kitKnown = Boolean(
    signals.htmlKitFingerprint &&
      knownMaliciousKits().has(signals.htmlKitFingerprint),
  );
  return [
    {
      id: "lookalike",
      label: "Lookalike or lure-keyword domain",
      present: signals.lookalikeScore >= 0.62,
      detail: `Lookalike score ${(signals.lookalikeScore * 100).toFixed(0)} vs official apex.`,
      weight: 3,
    },
    {
      id: "homoglyph",
      label: "Homoglyph / visual spoof of the brand label",
      present: signals.homoglyph,
      detail: signals.homoglyph
        ? "Normalized host label collapses onto the official brand label."
        : "No homoglyph collapse onto the official label.",
      weight: 2,
    },
    {
      id: "whois",
      label: "Newly registered domain",
      present: signals.whoisAgeDays <= 21,
      detail: `WHOIS stub: registered ${signals.whoisAgeDays} day(s) ago.`,
      weight: 2,
    },
    {
      id: "kit",
      label: "Known HTML kit fingerprint",
      present: kitKnown,
      detail: kitKnown
        ? `Fingerprint ${signals.htmlKitFingerprint} is in the malicious kit catalog.`
        : "No known kit fingerprint on this asset.",
      weight: 3,
    },
    {
      id: "visual",
      label: "High visual similarity to official property",
      present: signals.visualSimilarity >= 0.7,
      detail: `Stubbed visual similarity ${(signals.visualSimilarity * 100).toFixed(0)}.`,
      weight: 2,
    },
    {
      id: "drain",
      label: "Shared drain / payout address",
      present: signals.sharedDrain,
      detail: signals.sharedDrainAddress
        ? `Address ${signals.sharedDrainAddress} appears on multiple detections.`
        : "No clustered payout address.",
      weight: 4,
    },
    {
      id: "campaign",
      label: "Campaign cluster (kit or drain family)",
      present: signals.campaignSize >= 3,
      detail: signals.campaignId
        ? `Cluster ${signals.campaignId} · ${signals.campaignSize} assets.`
        : `${signals.campaignSize} related asset(s).`,
      weight: 2,
    },
    {
      id: "copy",
      label: "Impersonation copy (seed, permit, connect, claim)",
      present: signals.impersonationCopy,
      detail: signals.impersonationCopy
        ? "Page excerpt contains high-risk impersonation language."
        : "Excerpt does not include high-risk lure copy.",
      weight: 2,
    },
    {
      id: "allowlist",
      label: "On brand allowlist (official / licensed)",
      present: signals.allowlisted,
      detail: signals.allowlistReason
        ? `Allowlisted: ${signals.allowlistReason}.`
        : "Not on the brand allowlist.",
      weight: -5,
    },
  ];
}

export function buildRationale(
  detection: Detection,
  decision: Decision,
  signals: AgentSignals,
  evidence: EvidenceItem[],
): string {
  const present = evidence.filter((item) => item.present).map((item) => item.label);
  const domain = detection.suspicious.domain;

  if (decision === "APPROVE") {
    const cluster = signals.sharedDrain
      ? ` Shared drain ${signals.sharedDrainAddress} links this host to a campaign of ${signals.campaignSize}.`
      : signals.campaignSize >= 3
        ? ` Same kit/campaign family (${signals.campaignSize} assets).`
        : "";
    return `Draft APPROVE (recommend blocklist) for ${domain}. ${present
      .filter((label) => !label.startsWith("On brand"))
      .slice(0, 4)
      .join("; ")}.${cluster} Dry-run only — a human must confirm before any block.`;
  }

  if (decision === "REJECT") {
    if (signals.allowlisted) {
      return `Draft REJECT (dismiss) for ${domain}. Asset matches the brand allowlist (${signals.allowlistReason}). Treating as an official or licensed property. Dry-run only — a human must confirm.`;
    }
    return `Draft REJECT (dismiss) for ${domain}. Weak impersonation evidence (${present.join("; ") || "none"}). More likely a namesake or unrelated property. Dry-run only.`;
  }

  return `Draft WATCHLIST for ${domain}. Mixed or incomplete evidence — lookalike ${(signals.lookalikeScore * 100).toFixed(0)}, WHOIS ${signals.whoisAgeDays}d, kit ${signals.htmlKitFingerprint ?? "none"}, shared drain ${signals.sharedDrain ? "yes" : "no"}. Hold for another pass rather than block or dismiss. Dry-run only.`;
}

export function draftFromSignals(
  detection: Detection,
  signals: AgentSignals,
): DraftDecision {
  const riskScore = scoreSignals(signals);
  const evidence = buildEvidence(detection, signals);
  const decision = decide(riskScore, signals);
  return {
    decision,
    confidence: confidenceFor(decision, riskScore, evidence),
    riskScore,
    rationale: buildRationale(detection, decision, signals, evidence),
    evidence,
    signals,
    scorer: "heuristic",
    dryRun: true,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
