import { QueueView } from "@/components/QueueView";
import { listCampaigns } from "@/lib/campaigns";
import { triageAll } from "@/lib/agent";

export default function QueuePage() {
  const items = triageAll();
  const campaigns = listCampaigns();
  return <QueueView items={items} campaigns={campaigns} />;
}
