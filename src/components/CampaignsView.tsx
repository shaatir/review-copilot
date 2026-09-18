import { DecisionBadge } from "@/components/DecisionBadge";
import { Container, PageHeader, StatTile } from "@/components/console";
import { shortWallet } from "@/lib/format";
import type { Campaign, TriagedDetection } from "@/lib/types";
import Link from "next/link";

type CampaignsViewProps = {
  items: TriagedDetection[];
  campaigns: Campaign[];
};

export function CampaignsView({ items, campaigns }: CampaignsViewProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Campaigns"
        description="Clusters of detections that share a drain address, HTML kit, or lure pattern. Open a cluster to filter the queue, or inspect a representative asset."
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile label="Named clusters" value={campaigns.length} />
        <StatTile
          label="Clustered assets"
          value={campaigns.reduce((sum, campaign) => sum + campaign.detectionIds.length, 0)}
        />
        <StatTile label="Unclustered" value={items.filter((item) => !item.campaignId).length} />
      </div>

      <Container header="Campaign clusters" headerExtra={`${campaigns.length} resources`} noPad>
        <div className="overflow-x-auto">
          <table className="console-table min-w-[880px]">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Brand</th>
                <th>Kind</th>
                <th>Assets</th>
                <th>Draft mix</th>
                <th>Shared drain</th>
                <th>Kit</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const members = items.filter((item) => item.campaignId === campaign.id);
                const brand = members[0]?.brand.name ?? campaign.brandId;
                const mix = {
                  APPROVE: members.filter((item) => item.draft.decision === "APPROVE").length,
                  WATCHLIST: members.filter((item) => item.draft.decision === "WATCHLIST").length,
                  REJECT: members.filter((item) => item.draft.decision === "REJECT").length,
                };
                const representative = members[0];
                return (
                  <tr key={campaign.id}>
                    <td>
                      <Link
                        href={`/?campaign=${campaign.id}`}
                        className="font-medium text-blue hover:underline"
                      >
                        {campaign.name}
                      </Link>
                      <div className="mt-1 max-w-sm text-[12px] leading-4 text-muted">
                        {campaign.summary}
                      </div>
                      {representative ? (
                        <Link
                          href={`/detections/${representative.id}`}
                          className="mt-1 inline-block text-[12px] text-blue hover:underline"
                        >
                          Open {representative.id}
                        </Link>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap text-muted">{brand}</td>
                    <td className="whitespace-nowrap font-mono text-[12px] text-muted">
                      {campaign.kind.replace(/_/g, " ")}
                    </td>
                    <td className="font-mono text-[12px]">{campaign.detectionIds.length}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {mix.APPROVE ? <DecisionBadge decision="APPROVE" /> : null}
                        {mix.WATCHLIST ? <DecisionBadge decision="WATCHLIST" /> : null}
                        {mix.REJECT ? <DecisionBadge decision="REJECT" /> : null}
                        <span className="text-[11px] text-faint">
                          {mix.APPROVE}/{mix.WATCHLIST}/{mix.REJECT}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-[12px] text-muted">
                      {campaign.sharedWallets[0]
                        ? shortWallet(campaign.sharedWallets[0])
                        : "—"}
                    </td>
                    <td className="font-mono text-[12px] text-muted">
                      {campaign.htmlKit ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  );
}
