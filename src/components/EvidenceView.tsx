"use client";

import { BrowserMock } from "@/components/BrowserMock";
import { DecisionBadge } from "@/components/DecisionBadge";
import {
  Button,
  Container,
  Flashbar,
  KeyValuePairs,
  PageHeader,
} from "@/components/console";
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
import { Check, LoaderCircle } from "lucide-react";
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
    <div className="space-y-4">
      <PageHeader
        title={item.id}
        description={`${item.suspicious.domain} · ${item.source.replace(/_/g, " ")} · ${formatWhen(item.createdAt)}`}
        extra={<DecisionBadge decision={draft.decision} size="md" />}
      />

      <Flashbar type="warning">
        Dry-run draft — never auto-approved, never written to a blocklist.
      </Flashbar>

      <Container>
        <KeyValuePairs
          items={[
            { label: "Detection ID", value: <span className="font-mono">{item.id}</span> },
            { label: "Brand", value: item.brand.name },
            { label: "Source", value: item.source.replace(/_/g, " ") },
            { label: "First seen", value: formatWhen(item.createdAt) },
            {
              label: "Draft",
              value: <DecisionBadge decision={draft.decision} />,
            },
            { label: "Confidence", value: pct(draft.confidence) },
            { label: "Risk", value: pct(draft.riskScore) },
            {
              label: "Campaign",
              value: campaign ? (
                <Link
                  href={`/?campaign=${campaign.id}`}
                  className="text-blue hover:underline"
                >
                  {campaign.name}
                </Link>
              ) : (
                "—"
              ),
            },
          ]}
        />
      </Container>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Container header="Asset comparison">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="micro-label mb-2">Suspicious asset</div>
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
                <div className="micro-label mb-2">Official brand</div>
                <BrowserMock
                  variant="official"
                  brand={item.brand}
                  domain={item.brand.officialDomain}
                  title={item.brand.name}
                  excerpt={item.brand.tagline}
                />
              </div>
            </div>
          </Container>

          <Container header="Indicators of compromise">
            <dl className="divide-y divide-line border border-line">
              {iocs.map((ioc) => (
                <div
                  key={`${ioc.label}-${ioc.value}`}
                  className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="text-[12px] font-bold text-muted">{ioc.label}</dt>
                  <dd className="break-all font-mono text-[12px] text-ink">{ioc.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12px] text-faint">
              Synthetic demo IOCs only. Not live victim infrastructure.
            </p>
          </Container>

          <Container header="Scorer signals">
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
            <dl className="mt-4 divide-y divide-line border border-line">
              <Kv label="HTML kit" value={draft.signals.htmlKitFingerprint ?? "none"} mono />
              <Kv
                label="Shared drain"
                value={
                  draft.signals.sharedDrain
                    ? shortWallet(draft.signals.sharedDrainAddress ?? "")
                    : "no"
                }
                mono
              />
              <Kv label="Homoglyph" value={draft.signals.homoglyph ? "yes" : "no"} />
              <Kv
                label="Allowlist"
                value={draft.signals.allowlisted ? (draft.signals.allowlistReason ?? "yes") : "no"}
              />
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              {item.suspicious.visualNotes}
            </p>
          </Container>

          <Container
            header={campaign ? `Related detections · ${campaign.name}` : "Related detections"}
            noPad
          >
            {campaign ? (
              <p className="border-b border-line px-4 py-2 text-[12px] text-muted">
                {campaign.summary}
              </p>
            ) : (
              <p className="border-b border-line px-4 py-2 text-[12px] text-muted">
                No named campaign. Showing wallet- or kit-linked siblings when present.
              </p>
            )}
            {siblings.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-faint">No siblings in this cluster.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Host</th>
                      <th>Draft</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siblings.map((sibling) => (
                      <tr key={sibling.id}>
                        <td className="font-mono text-[12px]">
                          <Link
                            href={`/detections/${sibling.id}`}
                            className="text-blue hover:underline"
                          >
                            {sibling.id}
                          </Link>
                        </td>
                        <td>{sibling.suspicious.domain}</td>
                        <td>
                          <DecisionBadge decision={sibling.draft.decision} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Container>
        </div>

        <div className="space-y-4 xl:sticky xl:top-14 xl:self-start">
          <Container header="Draft decision">
            <div className="flex items-center justify-between gap-2">
              <DecisionBadge decision={draft.decision} size="md" />
              <span className="font-mono text-[12px] text-muted">
                {pct(draft.confidence)} conf · risk {pct(draft.riskScore)}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink">{draft.rationale}</p>
            <ul className="mt-3 space-y-2">
              {draft.evidence.map((entry) => (
                <li key={entry.id} className="flex gap-2 text-[12px]">
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] text-[10px] font-bold ${
                      entry.present
                        ? entry.weight < 0
                          ? "bg-reject-dim text-reject"
                          : "bg-approve-dim text-approve"
                        : "bg-row-alt text-faint"
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
            <Button
              type="button"
              onClick={refine}
              disabled={!llmReady || refining}
              className="mt-3 w-full"
            >
              {refining ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Refining…
                </>
              ) : llmReady ? (
                "Refine rationale with LLM"
              ) : (
                "LLM refine unavailable (no API key)"
              )}
            </Button>
          </Container>

          <Container header="Human decision">
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
                  className={`rounded-[2px] border px-2 py-2 text-[11px] font-bold ${
                    choice === value
                      ? "border-blue bg-reject-dim text-blue-hover"
                      : "border-line text-muted hover:border-line-strong hover:bg-row-alt"
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
              className="console-control mt-3 h-20 w-full resize-none px-3 py-2"
            />
            <Button type="button" variant="primary" onClick={record} className="mt-3 w-full">
              Record dry-run decision
            </Button>
            {human ? (
              <p className="mt-2 text-[12px] text-official">
                Recorded {human.decision} at {formatWhen(human.recordedAt)}. Still dry-run.
              </p>
            ) : null}
          </Container>

          <Container header="ChainPatrol asset.check">
            <p className="text-[12px] leading-relaxed text-muted">
              Read-only enrichment against the public{" "}
              <a
                className="text-blue hover:underline"
                href="https://chainpatrol.com/docs/external-api/asset-check"
                target="_blank"
                rel="noreferrer"
              >
                asset.check
              </a>{" "}
              API. If <code className="font-mono text-[12px]">CHAINPATROL_API_KEY</code> is
              unset, the call is skipped. This demo never reports or blocks.
            </p>
            <Button
              type="button"
              onClick={checkChainPatrol}
              disabled={checking}
              className="mt-3"
            >
              {checking
                ? "Checking…"
                : chainPatrolReady
                  ? `Check ${item.suspicious.domain}`
                  : "Check anyway (will skip without a key)"}
            </Button>
            {cp ? (
              <pre className="mt-3 overflow-auto border border-line bg-row-alt p-3 font-mono text-[11px] text-muted">
                {JSON.stringify(cp, null, 2)}
              </pre>
            ) : null}
          </Container>
        </div>
      </div>
    </div>
  );
}

function Kv({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[160px_minmax(0,1fr)]">
      <dt className="text-[12px] font-bold text-muted">{label}</dt>
      <dd className={`text-[12px] text-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
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
    <div className="mb-3">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden bg-row-alt">
        <div
          className="h-full bg-blue"
          style={{ width: `${Math.round(bar * 100)}%` }}
        />
      </div>
    </div>
  );
}
