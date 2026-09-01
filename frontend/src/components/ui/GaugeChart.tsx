import { useEffect, useRef } from 'react';
import type { RiskLevel } from '../../types';

interface Props {
  value: number;    // 0–100
  riskLevel?: RiskLevel;
  label?: string;
  size?: number;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

export default function GaugeChart({ value, riskLevel, label = 'Risk Score', size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = (size * 0.65) * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size * 0.65}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size * 0.55;
    const r = size * 0.38;
    const strokeW = size * 0.07;

    const targetColor = riskLevel ? RISK_COLORS[riskLevel] :
      value <= 30 ? RISK_COLORS.LOW :
      value <= 70 ? RISK_COLORS.MEDIUM :
      RISK_COLORS.HIGH;

    const draw = (v: number) => {
      ctx.clearRect(0, 0, size, size * 0.65);

      // Track arc (background)
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0, false);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = strokeW;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Value arc
      const angle = Math.PI + (v / 100) * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, angle, false);
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = strokeW;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Center value text
      ctx.fillStyle = '#0f172a';
      ctx.font = `700 ${size * 0.17}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(v).toString(), cx, cy - size * 0.04);

      // /100 label
      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 ${size * 0.075}px Inter, sans-serif`;
      ctx.fillText('/100', cx, cy + size * 0.1);
    };

    cancelAnimationFrame(animRef.current);
    const start = currentRef.current;
    const diff = value - start;
    const duration = 900;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      currentRef.current = start + diff * ease;
      draw(currentRef.current);
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, riskLevel, size]);

  return (
    <div className="gauge-container">
      <canvas ref={canvasRef} />
      <div className="gauge-label">{label}</div>
    </div>
  );
}
