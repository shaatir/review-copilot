import { checkAsset } from "@/lib/chainpatrol";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    content?: string;
  } | null;
  const content = body?.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  const result = await checkAsset(content);
  return NextResponse.json(result);
}
