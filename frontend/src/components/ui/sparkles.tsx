import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./sparkles.css";

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  alphaSpeed: number;
  vx: number;
  vy: number;
}

export const SparklesCore = ({
  id = "sparkles-canvas",
  className = "",
  background = "transparent",
  minSize = 0.6,
  maxSize = 1.8,
  speed = 1,
  particleColor = "#6366f1",
  particleDensity = 600,
}: SparklesCoreProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Calculate particle count based on density and area
      const area = (rect.width * rect.height) / 1000;
      const count = Math.min(180, Math.floor((area * particleDensity) / 1000));

      particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * (maxSize - minSize) + minSize,
        alpha: Math.random() * 0.8 + 0.2,
        targetAlpha: Math.random() * 0.9 + 0.1,
        alphaSpeed: (Math.random() * 0.02 + 0.008) * speed,
        vx: (Math.random() - 0.5) * 0.3 * speed,
        vy: (Math.random() * 0.4 + 0.1) * speed,
      }));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (background !== "transparent") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      particles.forEach((p) => {
        // Update opacity twinkle
        if (p.alpha < p.targetAlpha) {
          p.alpha += p.alphaSpeed;
          if (p.alpha >= p.targetAlpha) {
            p.targetAlpha = Math.random() * 0.9 + 0.1;
          }
        } else {
          p.alpha -= p.alphaSpeed;
          if (p.alpha <= p.targetAlpha) {
            p.targetAlpha = Math.random() * 0.9 + 0.1;
          }
        }

        // Update position drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = rect.width;
        if (p.x > rect.width) p.x = 0;
        if (p.y < 0) p.y = rect.height;
        if (p.y > rect.height) p.y = 0;

        // Draw glowing particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.shadowBlur = 4;
        ctx.shadowColor = particleColor;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [background, minSize, maxSize, speed, particleColor, particleDensity]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={cn("sparkles-canvas", className)}
    />
  );
};

export default SparklesCore;
