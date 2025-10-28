const BASE = "https://api.whop.com";

export type WhopMember = {
  id: string;
  user?: { id?: string; name?: string; username?: string; email?: string };
  display_name?: string;
  email?: string;
};

export async function listAllMembers(options: {
  companyId?: string;
  per?: number;      // 1..50
  maxPages?: number; // sécurité pagination
}) {
  const per = Math.min(Math.max(options.per ?? 50, 1), 50);
  const maxPages = Math.min(options.maxPages ?? 200, 500);

  const headers = {
    Authorization: `Bearer ${process.env.WHOP_API_KEY!}`,
    "Content-Type": "application/json",
  };

  const out: WhopMember[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL("/v5/app/members", BASE);
    url.searchParams.set("per", String(per));
    url.searchParams.set("page", String(page));
    if (options.companyId) url.searchParams.set("company_id", options.companyId);

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(
      `Whop /v5/app/members HTTP ${res.status}: ${await res.text()}`
    );
    const json = await res.json();
    const data = (json.data || []) as WhopMember[];
    out.push(...data);
    const pagination = json.pagination || {};
    if (!pagination.next_page || data.length === 0) break;
  }
  return out.map((x) => ({
    id: x.id,
    user: x.user,
    display_name: x.display_name,
    email: x.email || x.user?.email,
  }));
}
