import type { HumanReview } from "@/lib/types";

const KEY = "review-copilot.reviews";

export function loadReviews(): Record<string, HumanReview> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, HumanReview>) : {};
  } catch {
    return {};
  }
}

export function saveReview(review: HumanReview): Record<string, HumanReview> {
  const next = { ...loadReviews(), [review.detectionId]: review };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
