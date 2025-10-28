import { NextResponse } from "next/server";
import { listAllMembers } from "@/lib/whop";

export async function GET(req: Request) {
  try {
    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json({ error: "Missing WHOP_API_KEY" }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || undefined;
    const per = Number(searchParams.get("per") || "50");
    const maxPages = Number(searchParams.get("maxPages") || "200");

    const members = await listAllMembers({ companyId, per, maxPages });

    const normalized = members.map((m) => ({
      id: m.id,
      name: m.display_name || m.user?.name || m.user?.username || m.email || m.id,
      email: m.email || null,
    }));

    return NextResponse.json({ count: normalized.length, members: normalized });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Whop error" }, { status: 500 });
  }
}
