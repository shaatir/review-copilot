"use client";

import { DecisionBadge } from "@/components/DecisionBadge";
import { Container, PageHeader, StatTile } from "@/components/console";
import { formatWhen, pct } from "@/lib/format";
import { useReviews } from "@/lib/reviews";
import type { Campaign, Decision, TriagedDetection } from "@/lib/types";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type QueueViewProps = {
  items: TriagedDetection[];
  campaigns: Campaign[];
  initialCampaign?: string;
};

const DECISIONS: Array<Decision | "ALL"> = [
  "ALL",
  "APPROVE",
  "WATCHLIST",
  "REJECT",
];

export function QueueView({ items, campaigns, initialCampaign }: QueueViewProps) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("ALL");
  const [decision, setDecision] = useState<Decision | "ALL">("ALL");
  const [campaign, setCampaign] = useState(() =>
    campaigns.some((item) => item.id === initialCampaign) ? initialCampaign! : "ALL",
  );
  const reviews = useReviews();

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

  const filtersActive =
    query || brand !== "ALL" || decision !== "ALL" || campaign !== "ALL";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Detection queue"
        description="Draft decisions only. Review Copilot never writes a blocklist — it packages evidence so an analyst can."
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Open" value={stats.total} />
        <StatTile label="Approve" value={stats.approve} tone="approve" />
        <StatTile label="Watchlist" value={stats.watch} tone="watch" />
        <StatTile label="Reject" value={stats.reject} tone="reject" />
        <StatTile label="Campaigns" value={stats.clusters} />
      </div>

      <Container
        header="Detections"
        headerExtra={`${filtered.length} of ${items.length} shown`}
        noPad
      >
        <div className="flex flex-col gap-3 border-b border-line bg-row-alt px-3 py-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input
                id="queue-search"
                name="queue-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search domain, wallet, kit, DET-id"
                className="console-control w-full py-1.5 pl-8 pr-3"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="queue-brand"
                name="brand"
                aria-label="Filter by brand"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="console-control px-2 py-1.5"
              >
                <option value="ALL">All brands</option>
                {brands.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              <select
                id="queue-decision"
                name="decision"
                aria-label="Filter by draft decision"
                value={decision}
                onChange={(event) =>
                  setDecision(event.target.value as Decision | "ALL")
                }
                className="console-control px-2 py-1.5"
              >
                {DECISIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === "ALL" ? "All drafts" : value}
                  </option>
                ))}
              </select>
              <select
                id="queue-campaign"
                name="campaign"
                aria-label="Filter by campaign"
                value={campaign}
                onChange={(event) => setCampaign(event.target.value)}
                className="console-control px-2 py-1.5"
              >
                <option value="ALL">All campaigns</option>
                {campaigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setBrand("ALL");
                    setDecision("ALL");
                    setCampaign("ALL");
                  }}
                  className="text-[13px] text-blue hover:text-blue-hover hover:underline"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="micro-label mr-1">Clusters</span>
            <FilterChip
              active={campaign === "ALL"}
              onClick={() => setCampaign("ALL")}
            >
              All
            </FilterChip>
            {campaigns.map((item) => (
              <FilterChip
                key={item.id}
                active={campaign === item.id}
                onClick={() =>
                  setCampaign((current) => (current === item.id ? "ALL" : item.id))
                }
                title={item.summary}
              >
                {item.name}
                <span className="ml-1 text-faint">{item.detectionIds.length}</span>
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="console-table min-w-[920px]">
            <thead>
              <tr>
                <th>ID</th>
                <th>Brand</th>
                <th>Suspicious host</th>
                <th>Signals</th>
                <th>Draft</th>
                <th>Conf.</th>
                <th>Seen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const human = reviews[item.id];
                return (
                  <tr key={item.id}>
                    <td className="font-mono text-[12px]">
                      <Link
                        href={`/detections/${item.id}`}
                        className="text-blue hover:text-blue-hover hover:underline"
                      >
                        {item.id}
                      </Link>
                    </td>
                    <td className="text-muted">{item.brand.name}</td>
                    <td>
                      <Link href={`/detections/${item.id}`} className="block">
                        <span className="font-medium text-ink">
                          {item.suspicious.domain}
                        </span>
                        {item.campaignId ? (
                          <span className="ml-2 inline-flex rounded-[2px] border border-line bg-panel px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-muted">
                            cluster
                          </span>
                        ) : null}
                        {human ? (
                          <span className="ml-2 text-[11px] text-muted">
                            human: {human.decision}
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="text-[12px] text-muted">
                      lookalike {pct(item.draft.signals.lookalikeScore)}
                      {item.draft.signals.sharedDrain ? " · drain" : ""}
                      {item.draft.signals.htmlKitFingerprint ? " · kit" : ""}
                      {item.draft.signals.allowlisted ? " · allowlist" : ""}
                    </td>
                    <td>
                      <DecisionBadge decision={item.draft.decision} />
                    </td>
                    <td className="font-mono text-[12px] text-muted">
                      {pct(item.draft.confidence)}
                    </td>
                    <td className="whitespace-nowrap text-[12px] text-faint">
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
      </Container>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-[2px] border px-2 py-1 text-[12px] ${
        active
          ? "border-blue bg-reject-dim font-bold text-blue-hover"
          : "border-line bg-panel text-ink hover:bg-hover"
      }`}
    >
      {children}
    </button>
  );
}
