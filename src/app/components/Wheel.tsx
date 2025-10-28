"use client";
import { useMemo, useState } from "react";
import Wheel from "./components/Wheel";

type Member = { id: string; name: string; email?: string | null; userId?: string | null };

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [winners, setWinners] = useState<Member[]>([]);
  const [count, setCount] = useState(1);
  const [spinName, setSpinName] = useState<string | undefined>(undefined);
  const [spinKey, setSpinKey] = useState(0); // <-- spin control
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  }

  async function loadMembers() {
    try {
      setLoading(true);
      setWinners([]);
      setSpinName(undefined);
      const res = await fetch(`/api/members?per=200&maxPages=50`, { cache: "no-store" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setMembers(json.members || []);
    } catch (e: any) {
      alert(e.message || "Loading error");
    } finally {
      setLoading(false);
    }
  }

  async function selectWinner() {
    try {
      if (!members.length) return alert("Load members first");
      if (count < 1) return alert("Invalid number of winners");
      const res = await fetch(`/api/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members, count }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const ws: Member[] = json.winners || [];
      setWinners(ws);
      if (ws[0]?.name) {
        setSpinName(ws[0].name);
        setSpinKey((k) => k + 1); // <-- triggers wheel spin ONLY here
      }
    } catch (e: any) {
      alert(e.message || "Draw error");
    }
  }

  const wheelLabels = useMemo(() => {
    const max = 24;
    const base = members.slice(0, max).map((m) => m.name);
    if (spinName && !base.includes(spinName)) {
      if (base.length < max) return [...base, spinName];
      base[0] = spinName;
    }
    return base.length ? base : ["Waiting..."];
  }, [members, spinName]);

  function winnerHref(w: Member) {
    if (w.email) return `mailto:${w.email}`;
    return null;
  }

  async function copyText(txt: string) {
    try {
      await navigator.clipboard.writeText(txt);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  }

  return (
    <main style={{ padding: 24, color: "#e8eefc", background: "#0b0f14", minHeight: "100vh" }}>
      <h1 style={{ margin: 0 }}>WHOP Lucky Draw</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        Server-side raffle. The wheel is just a visual effect.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", gap: 24 }}>
        <section>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={loadMembers} disabled={loading} style={btn()}>
              {loading ? "Loading..." : "Load members"}
            </button>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label>Winners</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, members.length)}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  width: 100,
                  background: "#0f1522",
                  color: "#e8eefc",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={selectWinner}
              disabled={!members.length}
              style={btnBig()}
              title={!members.length ? "Load members first" : "Select winner"}
            >
              🎯 Select winner
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 14, opacity: 0.9 }}>
            Loaded members: <b>{members.length}</b>
          </div>

          <h3 style={{ marginTop: 24 }}>Winners</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {winners.map((w) => {
              const href = winnerHref(w);
              const chip = (
                <span
                  key={w.id}
                  style={{
                    background: "#22d3ee",
                    color: "#00323e",
                    padding: "10px 14px",
                    borderRadius: 999,
                    fontWeight: 800,
                    cursor: href ? "pointer" : "copy",
                    userSelect: "none",
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // <-- never affects the wheel
                    if (!href) copyText(`${w.name}`);
                  }}
                >
                  {w.name}
                </span>
              );
              return href ? (
                <a key={w.id} href={href} style={{ textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
                  {chip}
                </a>
              ) : (
                chip
              );
            })}
          </div>

          {toast && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                background: "rgba(255,255,255,0.08)",
                padding: "6px 10px",
                borderRadius: 8,
                width: "max-content",
              }}
            >
              {toast}
            </div>
          )}
        </section>

        <section style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* key=spinKey ensures a spin only when we change the key */}
          <div key={spinKey}>
            <Wheel labels={wheelLabels} highlight={spinName} onSpinEnd={() => { /* noop */ }} />
          </div>
        </section>
      </div>

      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 20 }}>
        Security notice: your Whop API key is never exposed. All requests go through `/api/*` server-side.
      </p>
    </main>
  );
}

function btn() {
  return {
    padding: 12,
    borderRadius: 10,
    background: "#1f2937",
    color: "#e8eefc",
    border: "1px solid rgba(255,255,255,0.08)",
  } as const;
}
function btnBig() {
  return {
    padding: "16px 18px",
    borderRadius: 12,
    background: "linear-gradient(135deg,#5eead4,#22d3ee)",
    color: "#001316",
    fontWeight: 900,
    fontSize: 18,
    boxShadow: "0 16px 40px rgba(34,211,238,0.25)",
  } as const;
}
