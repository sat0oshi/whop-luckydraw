"use client";
import { useEffect, useMemo, useRef, useState } from "react";

function genColors(n: number) {
  return Array.from({ length: n }, (_, i) => `hsl(${(i * (360 / n)) | 0} 85% 55%)`);
}

export default function Wheel({
  labels,
  highlight,
  onSpinEnd,
}: {
  labels: string[];
  highlight?: string;
  onSpinEnd?: () => void;
}) {
  const N = Math.max(1, labels.length);
  const colors = useMemo(() => genColors(N), [N]);
  const [angle, setAngle] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const targetIndex = useMemo(() => {
    if (!highlight) return null;
    const i = labels.findIndex((x) => x === highlight);
    return i >= 0 ? i : null;
  }, [labels, highlight]);

  useEffect(() => {
    if (targetIndex == null) return;
    const slice = 360 / N;
    const center = slice / 2;
    const spins = 6;
    const targetDeg = spins * 360 + targetIndex * slice + center;

    requestAnimationFrame(() => {
      if (!wheelRef.current) return;
      wheelRef.current.style.transition = "transform 3s cubic-bezier(0.22,1,0.36,1)";
      setAngle(-targetDeg);
    });

    const to = setTimeout(() => onSpinEnd && onSpinEnd(), 3100);
    return () => clearTimeout(to);
  }, [targetIndex, N, onSpinEnd]);

  return (
    <div style={{ position: "relative", width: 420, height: 420 }}>
      <div style={{
        position: "absolute",
        left: "50%",
        top: -6,
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "10px solid transparent",
        borderRight: "10px solid transparent",
        borderBottom: "18px solid #facc15",
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.4))",
        zIndex: 10,
      }} />
      <div
        ref={wheelRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          border: "10px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.35), 0 15px 60px rgba(0,0,0,0.45)",
          overflow: "hidden",
          transform: `rotate(${angle}deg)`,
        }}
      >
        {labels.map((label, i) => {
          const slice = 360 / N;
          const rotate = i * slice;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "50%",
                height: "50%",
                top: "50%",
                left: "50%",
                transformOrigin: "0% 0%",
                transform: `translate(-50%,-50%) rotate(${rotate}deg) skewY(${90 - slice}deg)`,
                background: colors[i],
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 12,
              }}
            >
              <span style={{
                transform: `skewY(${-(90 - slice)}deg)`,
                fontWeight: 800,
                color: "#001318",
                textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                fontSize: 12,
                maxWidth: 150,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
