"use client";

import { DecisionBadge } from "@/components/DecisionBadge";
import { formatWhen, pct, shortWallet } from "@/lib/format";
import { loadReviews } from "@/lib/reviews";
import type { Campaign, Decision, HumanReview, TriagedDetection } from "@/lib/types";
import { Filter, Layers3, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type QueueViewProps = {
  items: TriagedDetection[];
  campaigns: Campaign[];
};

const DECISIONS: Array<Decision | "ALL"> = [
  "ALL",
  "APPROVE",
  "WATCHLIST",
  "REJECT",
];

export function QueueView({ items, campaigns }: QueueViewProps) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("ALL");
  const [decision, setDecision] = useState<Decision | "ALL">("ALL");
  const [campaign, setCampaign] = useState("ALL");
  const [reviews] = useState<Record<string, HumanReview>>(() => loadReviews());

  const brands = useMemo(
    () => [...new Set(items.map((item) => item.brand.name))],
    [items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (brand !== "ALL" && item.brand.name !== brand) return false;
      if (decision !== "ALL" && item.draft.decision !== decision) return false;
      if (campaign !== "ALL" && item.campaignId !== campaign) return false;
      if (!needle) return true;
      const hay = [
        item.id,
        item.suspicious.domain,
        item.brand.name,
        item.suspicious.wallets.join(" "),
        item.suspicious.htmlKit ?? "",
        item.campaignId ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, query, brand, decision, campaign]);

  const stats = {
    total: items.length,
    approve: items.filter((item) => item.draft.decision === "APPROVE").length,
    watch: items.filter((item) => item.draft.decision === "WATCHLIST").length,
    reject: items.filter((item) => item.draft.decision === "REJECT").length,
    clusters: campaigns.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analyst queue</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Draft decisions only. Review Copilot never writes a blocklist —
            it packages evidence so an analyst can.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <Stat label="Open" value={stats.total} />
          <Stat label="Approve" value={stats.approve} tone="approve" />
          <Stat label="Watch" value={stats.watch} tone="watch" />
          <Stat label="Reject" value={stats.reject} tone="reject" />
          <Stat label="Campaigns" value={stats.clusters} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {campaigns.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              setCampaign((current) => (current === item.id ? "ALL" : item.id))
            }
            className={`rounded-xl border p-3 text-left transition ${
              campaign === item.id
                ? "border-accent/40 bg-accent-dim"
                : "border-line bg-elevated hover:border-line-strong"
            }`}
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
              <Layers3 className="h-3.5 w-3.5 text-accent" />
              Campaign cluster
            </div>
            <div className="mt-1 text-sm font-medium">{item.name}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {item.summary}
            </p>
            <div className="mt-2 font-mono text-[11px] text-faint">
              {item.detectionIds.length} assets
              {item.sharedWallets[0]
                ? ` · ${shortWallet(item.sharedWallets[0])}`
                : ""}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-elevated p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search domain, wallet, kit, DET-id…"
            className="w-full rounded-lg border border-line bg-bg py-2 pl-8 pr-3 text-sm outline-none placeholder:text-faint focus:border-line-strong"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <Filter className="h-3.5 w-3.5 text-faint" />
          <select
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            className="rounded-lg border border-line bg-bg px-2 py-2"
          >
            <option value="ALL">All brands</option>
            {brands.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <select
            value={decision}
            onChange={(event) =>
              setDecision(event.target.value as Decision | "ALL")
            }
            className="rounded-lg border border-line bg-bg px-2 py-2"
          >
            {DECISIONS.map((value) => (
              <option key={value} value={value}>
                {value === "ALL" ? "All drafts" : value}
              </option>
            ))}
          </select>
          <select
            value={campaign}
            onChange={(event) => setCampaign(event.target.value)}
            className="rounded-lg border border-line bg-bg px-2 py-2"
          >
            <option value="ALL">All campaigns</option>
            {campaigns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="bg-[#0a1220] text-[11px] uppercase tracking-wider text-faint">
            <tr>
              <th className="px-3 py-2.5 font-medium">ID</th>
              <th className="px-3 py-2.5 font-medium">Brand</th>
              <th className="px-3 py-2.5 font-medium">Suspicious host</th>
              <th className="px-3 py-2.5 font-medium">Signals</th>
              <th className="px-3 py-2.5 font-medium">Draft</th>
              <th className="px-3 py-2.5 font-medium">Conf.</th>
              <th className="px-3 py-2.5 font-medium">Seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const human = reviews[item.id];
              return (
                <tr key={item.id} className="border-t border-line bg-elevated hover:bg-hover">
                  <td className="px-3 py-2.5 font-mono text-[12px]">
                    <Link href={`/detections/${item.id}`} className="text-ink hover:text-accent">
                      {item.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{item.brand.name}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/detections/${item.id}`} className="block">
                      <span className="font-medium">{item.suspicious.domain}</span>
                      {item.campaignId ? (
                        <span className="ml-2 rounded-full bg-accent-dim px-1.5 py-0.5 text-[10px] text-accent">
                          cluster
                        </span>
                      ) : null}
                      {human ? (
                        <span className="ml-2 text-[10px] text-muted">
                          human: {human.decision}
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-muted">
                    lookalike {pct(item.draft.signals.lookalikeScore)}
                    {item.draft.signals.sharedDrain ? " · drain" : ""}
                    {item.draft.signals.htmlKitFingerprint ? " · kit" : ""}
                    {item.draft.signals.allowlisted ? " · allowlist" : ""}
                  </td>
                  <td className="px-3 py-2.5">
                    <DecisionBadge decision={item.draft.decision} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-muted">
                    {pct(item.draft.confidence)}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-faint">
                    {formatWhen(item.createdAt)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted">
                  No detections match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "approve" | "watch" | "reject";
}) {
  const color =
    tone === "approve"
      ? "text-approve"
      : tone === "watch"
        ? "text-watch"
        : tone === "reject"
          ? "text-reject"
          : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-elevated px-3 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`font-mono text-sm ${color}`}>{value}</div>
    </div>
  );
}
