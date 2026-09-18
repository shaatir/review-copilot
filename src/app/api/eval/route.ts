import { buildEvalReport } from "@/lib/eval";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(buildEvalReport());
}
