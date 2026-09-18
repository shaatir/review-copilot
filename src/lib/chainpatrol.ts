import type { ChainPatrolCheckResult } from "@/lib/types";

const ENDPOINT = "https://app.chainpatrol.io/api/v2/asset/check";

export function isChainPatrolConfigured(): boolean {
  return Boolean(process.env.CHAINPATROL_API_KEY);
}

export async function checkAsset(
  content: string,
): Promise<ChainPatrolCheckResult> {
  const apiKey = process.env.CHAINPATROL_API_KEY;
  if (!apiKey) {
    return {
      ok: true,
      skipped: true,
      skipReason:
        "CHAINPATROL_API_KEY is not set. asset.check was not called.",
      content,
    };
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ type: "URL", content }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        content,
        error: `ChainPatrol responded ${response.status}: ${body.slice(0, 240)}`,
      };
    }

    const data = (await response.json()) as {
      status?: ChainPatrolCheckResult["status"];
      source?: string;
      reason?: string;
      sources?: { source: string; status: string }[];
    };

    return {
      ok: true,
      content,
      status: data.status,
      source: data.source,
      reason: data.reason,
      sources: data.sources,
    };
  } catch (error) {
    return {
      ok: false,
      content,
      error: error instanceof Error ? error.message : "ChainPatrol request failed",
    };
  }
}
