import { detections } from "@/data/detections";
import { triageDetection } from "@/lib/agent";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    detectionId?: string;
    llm?: boolean;
  } | null;
  const detection = detections.find((item) => item.id === body?.detectionId);
  if (!detection) {
    return NextResponse.json({ error: "detection not found" }, { status: 404 });
  }
  const draft = await triageDetection(detection, { llm: Boolean(body?.llm) });
  return NextResponse.json({ draft });
}
