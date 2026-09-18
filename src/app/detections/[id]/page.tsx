import { EvidenceView } from "@/components/EvidenceView";
import { getTriaged, triageHeuristic } from "@/lib/agent";
import { campaignById } from "@/lib/campaigns";
import { campaignSiblings } from "@/lib/agent/signals";
import { brandById } from "@/data/brands";
import { runtimeFlags } from "@/lib/config";
import { notFound } from "next/navigation";

export default async function DetectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getTriaged(id);
  if (!item) notFound();

  const siblings = campaignSiblings(item).map((detection) => ({
    ...detection,
    brand: brandById[detection.brandId],
    draft: triageHeuristic(detection),
  }));
  const flags = runtimeFlags();

  return (
    <EvidenceView
      item={item}
      siblings={siblings}
      campaign={campaignById(item.campaignId)}
      llmReady={flags.llmReady}
      chainPatrolReady={flags.chainPatrolReady}
    />
  );
}
