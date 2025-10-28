const BASE = "https://api.whop.com";

type WhopUser = {
  id?: string;
  display_name?: string;
  username?: string;
  name?: string;
  handle?: string;
  slug?: string;
  email?: string;
};

type WhopMembership = {
  id: string;
  status?: string;
  user?: WhopUser;
};

function pickNiceName(u?: WhopUser, membershipId?: string) {
  if (!u) return `Member ${membershipId?.slice(-4) ?? ""}`.trim();
  const emailLocal = u.email ? u.email.split("@")[0] : "";
  return (
    u.display_name ||
    u.username ||
    u.name ||
    u.handle ||
    u.slug ||
    emailLocal ||
    `Member ${membershipId?.slice(-4) ?? ""}`.trim()
  );
}

/** v5/app/memberships with user included */
async function fetchMembershipsV5(options: {
  companyId?: string;
  per: number;
  maxPages: number;
  status: string;
}) {
  const headers = {
    Authorization: `Bearer ${process.env.WHOP_API_KEY!}`,
    "Content-Type": "application/json",
  };
  const out: WhopMembership[] = [];
  for (let page = 1; page <= options.maxPages; page++) {
    const url = new URL("/v5/app/memberships", BASE);
    url.searchParams.set("per", String(options.per));
    url.searchParams.set("page", String(page));
    url.searchParams.set("status", options.status);
    // Ces params sont souvent supportés par les APIs REST pour enrichir la réponse :
    url.searchParams.set("include", "user"); // si supporté
    url.searchParams.set("expand", "user");  // sinon
    if (options.companyId) url.searchParams.set("company_id", options.companyId);

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`Whop v5 memberships ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const data = (json.data || []) as WhopMembership[];
    out.push(...data);
    if (!json.pagination?.next_page || data.length === 0) break;
  }
  return out;
}

/** v2 members fallback to enrich names if v5 doesn't provide usernames */
async function fetchMembersV2(companyId?: string, limit = 1000) {
  const headers = {
    Authorization: `Bearer ${process.env.WHOP_API_KEY!}`,
    "Content-Type": "application/json",
  };
  const url = new URL("/api/v2/members", BASE);
  if (companyId) url.searchParams.set("company_id", companyId);
  url.searchParams.set("limit", String(Math.min(limit, 1000)));

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Whop v2 members ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.data || data.members || []);
  // index par user_id pour fusion
  const byUserId = new Map<string, any>();
  for (const x of items) {
    const uid = x.user_id || x.id;
    if (!uid) continue;
    byUserId.set(String(uid), x);
  }
  return byUserId;
}

/** Public: returns normalized members with readable names */
export async function listActiveMemberships(options: {
  companyId?: string;
  per?: number;
  maxPages?: number;
  status?: string;
}) {
  const per = Math.min(Math.max(options.per ?? 50, 1), 50);
  const maxPages = Math.min(options.maxPages ?? 200, 500);
  const status = options.status ?? "active";

  // 1) v5 memberships (+ include user)
  const memberships = await fetchMembershipsV5({ companyId: options.companyId, per, maxPages, status });

  let normalized = memberships.map((m) => {
    const u = m.user;
    return {
      id: m.id,
      userId: u?.id || null,
      name: pickNiceName(u, m.id),
      email: u?.email || null,
    };
  });

  // 2) si > 50% des noms sont encore génériques, on enrichit via v2
  const poor = normalized.filter((n) => n.name.startsWith("Member ")).length;
  if (normalized.length && poor / normalized.length > 0.5) {
    try {
      const mapV2 = await fetchMembersV2(options.companyId);
      normalized = normalized.map((n) => {
        if (!n.userId) return n;
        const v2 = mapV2.get(String(n.userId));
        if (!v2) return n;
        const email = v2.email || n.email;
        const name =
          v2.display_name ||
          v2.username ||
          v2.name ||
          (email ? String(email).split("@")[0] : null) ||
          n.name;
        return { ...n, name, email };
      });
    } catch {
      // si le fallback échoue, on garde la liste v5 telle quelle
    }
  }

  return normalized;
}
