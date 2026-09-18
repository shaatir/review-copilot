"use client";

import { useSyncExternalStore } from "react";
import type { HumanReview } from "@/lib/types";

const KEY = "review-copilot.reviews";
const EMPTY: Record<string, HumanReview> = Object.freeze({});
const listeners = new Set<() => void>();
let snapshot: Record<string, HumanReview> = EMPTY;
let rawCache: string | null = null;

function notify() {
  for (const listener of listeners) listener();
}

export function loadReviews(): Record<string, HumanReview> {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw === rawCache) return snapshot;
    rawCache = raw;
    snapshot = raw ? (JSON.parse(raw) as Record<string, HumanReview>) : EMPTY;
    return snapshot;
  } catch {
    rawCache = null;
    snapshot = EMPTY;
    return snapshot;
  }
}

export function saveReview(review: HumanReview): Record<string, HumanReview> {
  const next = { ...loadReviews(), [review.detectionId]: review };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  rawCache = JSON.stringify(next);
  snapshot = next;
  notify();
  return next;
}

export function subscribeReviews(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getReviewsServerSnapshot() {
  return EMPTY;
}

export function useReviews(): Record<string, HumanReview> {
  return useSyncExternalStore(
    subscribeReviews,
    loadReviews,
    getReviewsServerSnapshot,
  );
}
