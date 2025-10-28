const BASE = "https://api.whop.com";

/**
 * Uses the endpoint v5/app/memberships (Whop App context)
 * Filters by status "active" by default.
 * Supports pagination (page/per, per ≤ 50)
 */
export type WhopMembership = {
  id: string;
  status?: string;
  display_name?: string;
  user?: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
  };
};

export async function listActiveMemberships(options: {
  companyId?: string;
  per?: number;
  maxPages?: number;
  status?: string;
}) {
  const per = Math.min(Math.max(options.per ?? 50, 1), 50);
  const maxPages = Math.min(options.maxPages ?? 200, 500);
  const status = options.status ?? "active";

  const headers = {
    Authorization: `Bearer ${process.env.WHOP_API_KEY!}`,
    "Content-Type": "application/json",
  };

  const out: WhopMembership[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = new URL("/v5/app/memberships", BASE);
    url.searchParams.set("per", String(per));
    url.searchParams.set("page", String(page));
    url.searchParams.set("status", status);
    if (options.companyId) url.searchParams.set("company_id", options.companyId);

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok)
      throw new Error(
        `Whop /v5/app/memberships HTTP ${res.status}: ${await res.text()}`
      );

    const json = await res.json();
    const data = (json.data || []) as WhopMembership[];
    out.push(...data);

    const pagination = json.pagination || {};
    if (!pagination.next_page || data.length === 0) break;
  }

  // 🧠 Smart normalization for readable names
  return out.map((m) => {
    const u = m.user || {};
    const name =
      m.display_name ||
      u.name ||
      u.username ||
      (u.email ? u.email.split("@")[0] : null) ||
      `Member ${m.id.slice(-4)}`;
    return { id: m.id, name, email: u.email || null };
  });
}
