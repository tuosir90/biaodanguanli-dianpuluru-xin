import { NextResponse } from "next/server";
import { getWorkflowRefreshVersion } from "@/lib/workflow-refresh-signal";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const REFRESH_STREAM_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=45",
};

export async function GET() {
  return NextResponse.json(
    { version: getWorkflowRefreshVersion() },
    { headers: REFRESH_STREAM_CACHE_HEADERS }
  );
}
