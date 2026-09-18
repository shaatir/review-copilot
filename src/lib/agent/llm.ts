import type { Brand, Detection, DraftDecision } from "@/lib/types";

const SYSTEM = `You are Review Copilot, a dry-run triage assistant for crypto brand-protection analysts.
You never block, approve, or submit IOCs anywhere. You only refine a draft decision.
Return compact JSON: {"decision":"APPROVE"|"REJECT"|"WATCHLIST","confidence":0-1,"rationale":"..."}.
APPROVE = recommend adding to a blocklist (malicious). REJECT = dismiss as false positive. WATCHLIST = hold.
Prefer the heuristic decision unless you see a clear contradiction. Mention that a human remains the decision-maker.`;

export function isLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function refineWithLlm(
  detection: Detection,
  brand: Brand,
  draft: DraftDecision,
): Promise<DraftDecision> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    return draft;
  }

  const user = JSON.stringify(
    {
      brand: { name: brand.name, officialDomain: brand.officialDomain },
      detection: {
        id: detection.id,
        domain: detection.suspicious.domain,
        urls: detection.suspicious.urls,
        wallets: detection.suspicious.wallets,
        htmlKit: detection.suspicious.htmlKit,
        whoisDays: detection.suspicious.whois.registeredDaysAgo,
        excerpt: detection.suspicious.pageExcerpt,
      },
      heuristic: {
        decision: draft.decision,
        confidence: draft.confidence,
        riskScore: draft.riskScore,
        signals: draft.signals,
        evidence: draft.evidence,
        rationale: draft.rationale,
      },
    },
    null,
    2,
  );

  try {
    const parsed = openaiKey
      ? await callOpenAi(openaiKey, user)
      : await callAnthropic(anthropicKey as string, user);

    if (!parsed) return draft;

    return {
      ...draft,
      decision: parsed.decision ?? draft.decision,
      confidence: clamp(parsed.confidence ?? draft.confidence, 0.45, 0.98),
      rationale: parsed.rationale || draft.rationale,
      scorer: "heuristic+llm",
      dryRun: true,
    };
  } catch {
    return draft;
  }
}

type LlmJson = {
  decision?: DraftDecision["decision"];
  confidence?: number;
  rationale?: string;
};

async function callOpenAi(apiKey: string, user: string): Promise<LlmJson | null> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return safeJson(data.choices?.[0]?.message?.content);
}

async function callAnthropic(
  apiKey: string,
  user: string,
): Promise<LlmJson | null> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
      max_tokens: 400,
      temperature: 0.1,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((part) => part.type === "text")?.text;
  return safeJson(text);
}

function safeJson(text: string | undefined): LlmJson | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as LlmJson;
    if (
      parsed.decision &&
      !["APPROVE", "REJECT", "WATCHLIST"].includes(parsed.decision)
    ) {
      delete parsed.decision;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
