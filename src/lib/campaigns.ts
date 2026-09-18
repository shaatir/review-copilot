import { campaigns as campaignMeta, detections } from "@/data/detections";
import type { Campaign } from "@/lib/types";

export function listCampaigns(): Campaign[] {
  return campaignMeta.map((campaign) => ({
    ...campaign,
    detectionIds: detections
      .filter((detection) => detection.campaignId === campaign.id)
      .map((detection) => detection.id),
  }));
}

export function campaignById(id: string | undefined): Campaign | undefined {
  if (!id) return undefined;
  return listCampaigns().find((campaign) => campaign.id === id);
}
