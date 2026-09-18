import { brandById } from "@/data/brands";
import { detections } from "@/data/detections";
import { draftFromSignals } from "@/lib/agent/heuristic";
import { isLlmConfigured, refineWithLlm } from "@/lib/agent/llm";
import { collectSignals } from "@/lib/agent/signals";
import type { Detection, DraftDecision, TriagedDetection } from "@/lib/types";

export { isLlmConfigured };

export function triageHeuristic(detection: Detection): DraftDecision {
  const brand = brandById[detection.brandId];
  const signals = collectSignals(detection, brand);
  return draftFromSignals(detection, signals);
}

export async function triageDetection(
  detection: Detection,
  options?: { llm?: boolean },
): Promise<DraftDecision> {
  const heuristic = triageHeuristic(detection);
  if (options?.llm && isLlmConfigured()) {
    return refineWithLlm(detection, brandById[detection.brandId], heuristic);
  }
  return heuristic;
}

export function triageAll(): TriagedDetection[] {
  return detections
    .map((detection) => ({
      ...detection,
      brand: brandById[detection.brandId],
      draft: triageHeuristic(detection),
    }))
    .sort((a, b) => {
      const rank = rankDecision(a.draft.decision) - rankDecision(b.draft.decision);
      if (rank !== 0) return rank;
      return b.draft.confidence - a.draft.confidence;
    });
}

export function getTriaged(id: string): TriagedDetection | undefined {
  const detection = detections.find((item) => item.id === id);
  if (!detection) return undefined;
  return {
    ...detection,
    brand: brandById[detection.brandId],
    draft: triageHeuristic(detection),
  };
}

function rankDecision(decision: DraftDecision["decision"]): number {
  if (decision === "APPROVE") return 0;
  if (decision === "WATCHLIST") return 1;
  return 2;
}
