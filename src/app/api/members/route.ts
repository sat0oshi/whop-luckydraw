import { NextResponse } from "next/server";
import { listActiveMemberships } from "../../../lib/whop";

export async function GET(req: Request) {
  try {
    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json({ error: "Missing WHOP_API_KEY" }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || undefined;
    const per = Number(searchParams.get("per") || "50");
    const maxPages = Number(searchParams.get("maxPages") || "200");
    const status = searchParams.get("status") || "active";

    const members = await listActiveMemberships({ companyId, per, maxPages, status });
    return NextResponse.json({ count: members.length, members });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Whop error" }, { status: 500 });
  }
}
