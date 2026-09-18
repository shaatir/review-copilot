"use client";

import { BrowserMock } from "@/components/BrowserMock";
import { DecisionBadge } from "@/components/DecisionBadge";
import { formatWhen, pct, shortWallet } from "@/lib/format";
import { loadReviews, saveReview } from "@/lib/reviews";
import type {
  Campaign,
  ChainPatrolCheckResult,
  Decision,
  DraftDecision,
  HumanReview,
  TriagedDetection,
} from "@/lib/types";
import {
  ArrowLeft,
  Check,
  CircleHelp,
  ExternalLink,
  ListChecks,
  LoaderCircle,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type EvidenceViewProps = {
  item: TriagedDetection;
  siblings: TriagedDetection[];
  campaign?: Campaign;
  llmReady: boolean;
  chainPatrolReady: boolean;
};

export function EvidenceView({
  item,
  siblings,
  campaign,
  llmReady,
  chainPatrolReady,
}: EvidenceViewProps) {
  const [draft, setDraft] = useState<DraftDecision>(item.draft);
  const [human, setHuman] = useState<HumanReview | undefined>(
    () => loadReviews()[item.id],
  );
  const [note, setNote] = useState(human?.note ?? "");
  const [choice, setChoice] = useState<Decision>(human?.decision ?? item.draft.decision);
  const [refining, setRefining] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cp, setCp] = useState<ChainPatrolCheckResult | null>(null);

  const iocs = useMemo(
    () => [
      { label: "Domain", value: item.suspicious.domain },
      ...item.suspicious.urls.map((url, index) => ({
        label: index === 0 ? "URL" : `URL ${index + 1}`,
        value: url,
      })),
      ...item.suspicious.wallets.map((wallet, index) => ({
        label: item.suspicious.wallets.length === 1 ? "Wallet" : `Wallet ${index + 1}`,
        value: wallet,
      })),
    ],
    [item],
  );

  async function refine() {
    setRefining(true);
    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detectionId: item.id, llm: true }),
      });
      const data = (await response.json()) as { draft?: DraftDecision };
      if (data.draft) {
        setDraft(data.draft);
        if (!human) setChoice(data.draft.decision);
      }
    } finally {
      setRefining(false);
    }
  }

  async function checkChainPatrol() {
    setChecking(true);
    try {
      const response = await fetch("/api/chainpatrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: item.suspicious.domain }),
      });
      setCp((await response.json()) as ChainPatrolCheckResult);
    } finally {
      setChecking(false);
    }
  }

  function record() {
    const next = saveReview({
      detectionId: item.id,
      decision: choice,
      note,
      recordedAt: new Date().toISOString(),
    });
    setHuman(next[item.id]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Queue
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-lg font-semibold">{item.id}</h1>
            <span className="text-muted">{item.brand.name}</span>
            <DecisionBadge decision={draft.decision} size="md" />
          </div>
          <p className="mt-1 text-sm text-muted">
            {item.suspicious.domain} · {item.source.replace("_", " ")} ·{" "}
            {formatWhen(item.createdAt)}
          </p>
        </div>
        <div className="rounded-xl border border-accent/25 bg-accent-dim px-3 py-2 text-[12px] text-accent">
          Dry-run draft — never auto-approved, never written to a blocklist.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionLabel>Suspicious asset</SectionLabel>
          <BrowserMock
            variant="suspicious"
            brand={item.brand}
            domain={item.suspicious.domain}
            title={item.suspicious.title}
            excerpt={item.suspicious.pageExcerpt}
            hue={item.suspicious.faviconHue}
          />
        </div>
        <div>
          <SectionLabel>Official brand</SectionLabel>
          <BrowserMock
            variant="official"
            brand={item.brand}
            domain={item.brand.officialDomain}
            title={item.brand.name}
            excerpt={item.brand.tagline}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Panel title="IOCs" icon={<Wallet className="h-3.5 w-3.5" />}>
          <dl className="space-y-2">
            {iocs.map((ioc) => (
              <div key={`${ioc.label}-${ioc.value}`}>
                <dt className="text-[10px] uppercase tracking-wider text-faint">
                  {ioc.label}
                </dt>
                <dd className="break-all font-mono text-[12px] text-ink">{ioc.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-faint">
            Synthetic demo IOCs only. Not live victim infrastructure.
          </p>
        </Panel>

        <Panel title="Signals" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
          <Signal
            label="Lookalike score"
            value={pct(draft.signals.lookalikeScore)}
            bar={draft.signals.lookalikeScore}
          />
          <Signal
            label="Visual similarity (stub)"
            value={pct(draft.signals.visualSimilarity)}
            bar={draft.signals.visualSimilarity}
          />
          <Signal
            label="WHOIS / DNS age (stub)"
            value={`${draft.signals.whoisAgeDays}d · risk ${pct(draft.signals.whoisRisk)}`}
            bar={draft.signals.whoisRisk}
          />
          <div className="mt-3 space-y-1.5 text-[12px] text-muted">
            <div>
              HTML kit:{" "}
              <span className="font-mono text-ink">
                {draft.signals.htmlKitFingerprint ?? "none"}
              </span>
            </div>
            <div>
              Shared drain:{" "}
              <span className="font-mono text-ink">
                {draft.signals.sharedDrain
                  ? shortWallet(draft.signals.sharedDrainAddress ?? "")
                  : "no"}
              </span>
            </div>
            <div>
              Homoglyph: {draft.signals.homoglyph ? "yes" : "no"} · Allowlist:{" "}
              {draft.signals.allowlisted ? draft.signals.allowlistReason : "no"}
            </div>
            <p className="pt-1 text-[11px] leading-relaxed text-faint">
              {item.suspicious.visualNotes}
            </p>
          </div>
        </Panel>

        <Panel title="Draft decision" icon={<ListChecks className="h-3.5 w-3.5" />}>
          <div className="flex items-center justify-between gap-2">
            <DecisionBadge decision={draft.decision} size="md" />
            <span className="font-mono text-[12px] text-muted">
              {pct(draft.confidence)} conf · risk {pct(draft.riskScore)}
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink/90">{draft.rationale}</p>
          <ul className="mt-3 space-y-1.5">
            {draft.evidence.map((entry) => (
              <li key={entry.id} className="flex gap-2 text-[12px]">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm ${
                    entry.present
                      ? entry.weight < 0
                        ? "bg-reject-dim text-reject"
                        : "bg-approve-dim text-approve"
                      : "bg-hover text-faint"
                  }`}
                >
                  {entry.present ? <Check className="h-3 w-3" /> : "–"}
                </span>
                <span>
                  <span className="text-ink">{entry.label}</span>
                  <span className="block text-[11px] text-faint">{entry.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={refine}
            disabled={!llmReady || refining}
            className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-[12px] text-muted hover:border-line-strong hover:text-ink disabled:opacity-40"
          >
            {refining ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Refining…
              </span>
            ) : llmReady ? (
              "Refine rationale with LLM"
            ) : (
              "LLM refine unavailable (no API key)"
            )}
          </button>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={campaign ? `Campaign · ${campaign.name}` : "Related assets"}
          icon={<CircleHelp className="h-3.5 w-3.5" />}
        >
          {campaign ? (
            <p className="mb-3 text-[12px] text-muted">{campaign.summary}</p>
          ) : (
            <p className="mb-3 text-[12px] text-muted">
              No named campaign. Showing wallet- or kit-linked siblings when present.
            </p>
          )}
          <div className="space-y-1.5">
            {siblings.length === 0 ? (
              <p className="text-[12px] text-faint">No siblings in this cluster.</p>
            ) : (
              siblings.map((sibling) => (
                <Link
                  key={sibling.id}
                  href={`/detections/${sibling.id}`}
                  className="flex items-center justify-between rounded-lg border border-line px-2.5 py-2 hover:bg-hover"
                >
                  <span>
                    <span className="font-mono text-[11px] text-muted">{sibling.id}</span>
                    <span className="ml-2 text-[12px]">{sibling.suspicious.domain}</span>
                  </span>
                  <DecisionBadge decision={sibling.draft.decision} />
                </Link>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Human decision (session only)" icon={<Check className="h-3.5 w-3.5" />}>
          <p className="text-[12px] text-muted">
            Record a call the way an analyst would. It stays in this browser session
            and is never submitted to a registrar, wallet, or ChainPatrol.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["APPROVE", "WATCHLIST", "REJECT"] as Decision[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setChoice(value)}
                className={`rounded-lg border px-2 py-2 text-[11px] font-medium ${
                  choice === value
                    ? "border-accent/40 bg-accent-dim text-accent"
                    : "border-line text-muted hover:border-line-strong"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <textarea
            id="analyst-note"
            name="analyst-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional analyst note"
            className="mt-3 h-20 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-[12px] outline-none focus:border-line-strong"
          />
          <button
            type="button"
            onClick={record}
            className="mt-3 w-full rounded-lg bg-ink px-3 py-2 text-[12px] font-semibold text-bg hover:opacity-90"
          >
            Record dry-run decision
          </button>
          {human ? (
            <p className="mt-2 text-[11px] text-accent">
              Recorded {human.decision} at {formatWhen(human.recordedAt)}. Still dry-run.
            </p>
          ) : null}
        </Panel>
      </div>

      <Panel title="Optional ChainPatrol asset.check" icon={<ExternalLink className="h-3.5 w-3.5" />}>
        <p className="text-[12px] leading-relaxed text-muted">
          Read-only enrichment against the public{" "}
          <a
            className="text-accent hover:underline"
            href="https://chainpatrol.com/docs/external-api/asset-check"
            target="_blank"
            rel="noreferrer"
          >
            asset.check
          </a>{" "}
          API. If <code className="font-mono text-[11px]">CHAINPATROL_API_KEY</code> is
          unset, the call is skipped. This demo never reports or blocks.
        </p>
        <button
          type="button"
          onClick={checkChainPatrol}
          disabled={checking}
          className="mt-3 rounded-lg border border-line px-3 py-2 text-[12px] text-muted hover:border-line-strong hover:text-ink disabled:opacity-40"
        >
          {checking
            ? "Checking…"
            : chainPatrolReady
              ? `Check ${item.suspicious.domain}`
              : "Check anyway (will skip without a key)"}
        </button>
        {cp ? (
          <pre className="mt-3 overflow-auto rounded-lg border border-line bg-bg p-3 font-mono text-[11px] text-muted">
            {JSON.stringify(cp, null, 2)}
          </pre>
        ) : null}
      </Panel>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] uppercase tracking-wider text-faint">
      {children}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-elevated p-4">
      <h2 className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-muted">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Signal({
  label,
  value,
  bar,
}: {
  label: string;
  value: string;
  bar: number;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.round(bar * 100)}%` }}
        />
      </div>
    </div>
  );
}
