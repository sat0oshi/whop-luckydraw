const BASE = "https://api.whop.com";

type V2Member = {
  id?: string;           // membership id
  user_id?: string;      // user id
  display_name?: string;
  username?: string;
  name?: string;
  handle?: string;
  slug?: string;
  email?: string;
};

function niceName(m: V2Member) {
  const emailLocal = m.email ? String(m.email).split("@")[0] : "";
  return (
    m.display_name ||
    m.username ||
    m.name ||
    m.handle ||
    m.slug ||
    emailLocal ||
    `Member ${String(m.id || m.user_id || "").slice(-4)}`
  );
}

/** Fetches members from v2 (better public fields) with pagination */
export async function listReadableMembers(options: {
  companyId?: string;
  per?: number;      // 1..200
  maxPages?: number; // safety cap
}) {
  const per = Math.min(Math.max(options.per ?? 200, 1), 200);
  const maxPages = Math.min(options.maxPages ?? 50, 200);

  const headers = {
    Authorization: `Bearer ${process.env.WHOP_API_KEY!}`,
    "Content-Type": "application/json",
  };

  const all: V2Member[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL("/api/v2/members", BASE);
    url.searchParams.set("per", String(per));
    url.searchParams.set("page", String(page));
    if (options.companyId) url.searchParams.set("company_id", options.companyId);

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`Whop v2/members ${res.status}: ${await res.text()}`);

    const json = await res.json();
    const data: V2Member[] = Array.isArray(json) ? json : (json.data || json.members || []);
    all.push(...data);

    const pagination = json.pagination || {};
    if (!pagination?.next_page || data.length === 0) break;
  }

  return all.map((m) => ({
    id: m.id || m.user_id || cryptoRandomId(),
    userId: m.user_id || null,
    name: niceName(m),
    email: m.email || null,
  }));
}

function cryptoRandomId() {
  return "tmp_" + Math.random().toString(36).slice(2, 10);
}
