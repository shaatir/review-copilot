import { QueueView } from "@/components/QueueView";
import { listCampaigns } from "@/lib/campaigns";
import { triageAll } from "@/lib/agent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Queue",
};

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const params = await searchParams;
  const items = triageAll();
  const campaigns = listCampaigns();
  return (
    <QueueView
      items={items}
      campaigns={campaigns}
      initialCampaign={params.campaign}
    />
  );
}
