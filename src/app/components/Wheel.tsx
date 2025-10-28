"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  labels: string[];
  /** when this changes, the wheel spins to that label */
  highlight?: string;
  onSpinEnd?: () => void;
};

export default function Wheel({ labels, highlight, onSpinEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(0);

  // Compute index of target label
  const targetIndex = useMemo(() => {
    if (!highlight) return null;
    const i = labels.findIndex((x) => x === highlight);
    return i >= 0 ? i : null;
  }, [labels, highlight]);

  // Spin to the target whenever highlight changes
  useEffect(() => {
    if (targetIndex == null || labels.length === 0) return;

    const sliceDeg = 360 / labels.length;
    const sliceCenter = sliceDeg / 2;
    const spins = 6; // full rotations
    const targetDeg = spins * 360 + targetIndex * sliceDeg + sliceCenter;

    let raf = 0;
    const start = performance.now();
    const dur = 1100 + labels.length * 60; // a bit dynamic

    const animate = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      setAngle(-targetDeg * ease);
      if (p < 1) raf = requestAnimationFrame(animate);
      else onSpinEnd && onSpinEnd();
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [targetIndex, labels.length, onSpinEnd]);

  // Draw wheel on each angle/labels change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    const r = size / 2;

    // HiDPI crispness
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size, size);

    // background & rim
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 18;

    const colors = [
      "#fde047","#60a5fa","#f472b6","#34d399","#fca5a5",
      "#a78bfa","#22d3ee","#fb923c","#93c5fd","#f9a8d4",
      "#86efac","#fca5a5","#c4b5fd","#67e8f9","#f59e0b",
    ];

    const n = Math.max(1, labels.length);
    const slice = (2 * Math.PI) / n;

    for (let i = 0; i < n; i++) {
      const start = i * slice;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 8, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // text
      ctx.save();
      ctx.rotate(start + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#0b0f14";
      ctx.font = "bold 14px system-ui, sans-serif";
      const text = (labels[i] || "").slice(0, 14);
      ctx.fillText(text, r - 18, 5);
      ctx.restore();
    }
    ctx.restore();

    // ring
    ctx.beginPath();
    ctx.arc(r, r, r - 6, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();

    // pointer
    ctx.beginPath();
    ctx.moveTo(r - 10, 6);
    ctx.lineTo(r + 20, 0);
    ctx.lineTo(r - 10, -6);
    ctx.closePath();
    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 8;
    ctx.fill();
  }, [angle, labels]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={420}
      style={{
        width: 420,
        height: 420,
        borderRadius: "50%",
        background: "#0b0f14",
        boxShadow: "0 16px 50px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,0,0,0.25)",
      }}
    />
  );
}
