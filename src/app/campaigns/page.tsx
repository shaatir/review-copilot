import { CampaignsView } from "@/components/CampaignsView";
import { listCampaigns } from "@/lib/campaigns";
import { triageAll } from "@/lib/agent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns",
};

export default function CampaignsPage() {
  return <CampaignsView items={triageAll()} campaigns={listCampaigns()} />;
}
