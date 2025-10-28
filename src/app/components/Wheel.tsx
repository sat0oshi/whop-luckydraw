"use client";
import { useEffect, useRef, useState } from "react";

export default function Wheel({
  labels,
  highlight,
  onSpinEnd,
}: {
  labels: string[];
  highlight?: string;
  onSpinEnd?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);

  // spin animation
  useEffect(() => {
    if (!spinning) return;
    let frame: number;
    const spinDuration = 3000;
    const spinSpeed = 20 + Math.random() * 10;
    const start = performance.now();

    const animate = (t: number) => {
      const elapsed = t - start;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAngle(spinSpeed * 100 * (1 - easeOut));
      if (progress < 1) frame = requestAnimationFrame(animate);
      else {
        setSpinning(false);
        onSpinEnd?.();
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [spinning]);

  // draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);

    const colors = [
      "#F87171", "#FACC15", "#4ADE80", "#60A5FA", "#A78BFA",
      "#FB7185", "#FBBF24", "#34D399", "#38BDF8", "#C084FC",
      "#F472B6", "#FDE68A", "#5EEAD4", "#93C5FD", "#E879F9",
    ];

    const slice = (2 * Math.PI) / labels.length;
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate((angle * Math.PI) / 180);

    labels.forEach((label, i) => {
      const startAngle = i * slice;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, startAngle + slice);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      ctx.save();
      ctx.rotate(startAngle + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#0b0f14";
      ctx.font = "bold 16px Arial";
      ctx.fillText(label.slice(0, 10), radius - 10, 5);
      ctx.restore();
    });

    ctx.restore();

    // pointer
    ctx.beginPath();
    ctx.moveTo(radius - 10, 0);
    ctx.lineTo(radius + 20, 10);
    ctx.lineTo(radius + 20, -10);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
  }, [labels, angle]);

  return (
    <div
      style={{ position: "relative", cursor: "pointer" }}
      onClick={() => !spinning && setSpinning(true)}
    >
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{
          borderRadius: "50%",
          boxShadow: "0 0 30px rgba(34,211,238,0.25)",
          background: "#0b0f14",
        }}
      />
      <p
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#fff",
          fontSize: 18,
          fontWeight: 700,
          textShadow: "0 2px 10px rgba(0,0,0,0.4)",
        }}
      >
        {highlight || "Tap to spin"}
      </p>
    </div>
  );
}
