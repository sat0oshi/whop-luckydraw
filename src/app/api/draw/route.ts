import { NextResponse } from "next/server";

function sampleUnique<T>(arr: T[], k: number) {
  const a = arr.slice();
  const winners: T[] = [];
  while (winners.length < k && a.length) {
    const idx = Math.floor(Math.random() * a.length);
    winners.push(a.splice(idx, 1)[0]);
  }
  return winners;
}

export async function POST(req: Request) {
  try {
    const { members, count } = await req.json();
    if (!Array.isArray(members) || !members.length) {
      return NextResponse.json({ error: "No members provided" }, { status: 400 });
    }
    const k = Math.max(1, Math.min(Number(count) || 1, members.length));
    const winners = sampleUnique(members, k);

    // TODO (optionnel): persister un log/seed/hash pour preuve d'équité
    return NextResponse.json({
      winners,
      meta: { total: members.length, count: k, ts: Date.now() },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad request" }, { status: 400 });
  }
}
