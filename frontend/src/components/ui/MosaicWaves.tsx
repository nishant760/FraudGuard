import React, { useEffect, useRef } from "react";

export interface MosaicWavesProps {
  /** Size of each mosaic tile/dot in pixels (default: 1.15 to keep same small size) */
  dotSize?: number;
  /** Gap between mosaic grid cells in pixels (default: 9) */
  gridGap?: number;
  /** Speed of rolling waves (default: 0.85) */
  waveSpeed?: number;
  /** Wave frequency across the grid (default: 0.018) */
  waveFrequency?: number;
  /** Primary accent color (default: '#10b981') */
  color?: string;
  /** Canvas background fill (default: '#ffffff') */
  backgroundColor?: string;
  /** Minimum baseline opacity of each mosaic tile (default: 0.12) */
  minOpacity?: number;
  /** Peak opacity at wave crests (default: 0.92) */
  maxOpacity?: number;
  /** Enable mouse wave ripple interaction (default: true) */
  interactive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * Mosaic Waves Component (React Bits Pro style)
 * 
 * Renders waves rolling smoothly through a dense mosaic of shifting tiles and micro-elements,
 * creating fluid undulating ripples with subtle geometric perspective and harmonic wave fronts.
 */
export const MosaicWaves: React.FC<MosaicWavesProps> = ({
  dotSize = 1.15,
  gridGap = 9,
  waveSpeed = 0.85,
  waveFrequency = 0.018,
  color = "#10b981",
  backgroundColor = "#ffffff",
  minOpacity = 0.12,
  maxOpacity = 0.92,
  interactive = true,
  className = "",
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetColorRef = useRef(color);

  useEffect(() => {
    targetColorRef.current = color;
  }, [color]);

  const mouseRef = useRef<{ x: number; y: number; vx: number; vy: number; active: boolean }>({
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const parseColor = (col: string): [number, number, number] => {
      if (col.startsWith("#")) {
        let hex = col.slice(1);
        if (hex.length === 3 || hex.length === 4) {
          hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
        }
        if (hex.length >= 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            return [r, g, b];
          }
        }
      }
      const match = col.match(/\d+/g);
      if (match && match.length >= 3) {
        return [parseInt(match[0], 10), parseInt(match[1], 10), parseInt(match[2], 10)];
      }
      return [16, 185, 129];
    };

    const [initR, initG, initB] = parseColor(targetColorRef.current);
    let currentR = initR;
    let currentG = initG;
    let currentB = initB;

    interface TileData {
      x: number;
      y: number;
      col: number;
      row: number;
      noiseOffset: number;
    }

    let tiles: TileData[] = [];

    const initGrid = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const cellSize = dotSize + gridGap;
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      tiles = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          tiles.push({
            x: c * cellSize,
            y: r * cellSize,
            col: c,
            row: r,
            noiseOffset: (Math.sin(c * 0.3) * Math.cos(r * 0.3) + 1) * 0.5,
          });
        }
      }
    };

    initGrid();

    const resizeObserver = new ResizeObserver(() => {
      initGrid();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", initGrid);
    }

    let lastMouseX = -1000;
    let lastMouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = {
        x: mx,
        y: my,
        vx: mx - lastMouseX,
        vy: my - lastMouseY,
        active: true,
      };
      lastMouseX = mx;
      lastMouseY = my;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000 * waveSpeed;

      // Color transition
      const [targetR, targetG, targetB] = parseColor(targetColorRef.current);
      currentR += (targetR - currentR) * 0.08;
      currentG += (targetG - currentG) * 0.08;
      currentB += (targetB - currentB) * 0.08;

      const r = Math.round(currentR);
      const g = Math.round(currentG);
      const b = Math.round(currentB);

      ctx.clearRect(0, 0, width, height);

      if (backgroundColor && backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      const mouse = mouseRef.current;
      const mouseRadius = 140;
      const baseRadius = dotSize / 2;

      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];

        // Harmonic mosaic wave calculation:
        // Wave 1: Diagonal traveling wave rolling across screen
        const w1 = Math.sin((tile.x + tile.y) * waveFrequency - elapsed * 2.2);
        // Wave 2: Secondary undulating cross-wave
        const w2 = Math.cos((tile.x * 1.3 - tile.y * 0.8) * (waveFrequency * 0.8) + elapsed * 1.4);
        // Wave 3: Subtle rotational modulation
        const w3 = Math.sin(Math.sqrt(tile.x * tile.x + tile.y * tile.y) * (waveFrequency * 0.6) - elapsed * 1.8);

        // Combined normalized wave height [-1, 1] -> [0, 1]
        const waveHeight = ((w1 * 0.5 + w2 * 0.3 + w3 * 0.2) + 1) * 0.5;

        // Wave crest effect
        const crest = Math.pow(waveHeight, 2.2);

        let alpha = minOpacity + crest * (maxOpacity - minOpacity);
        let shiftScale = 0.8 + crest * 0.45;

        // Mouse interactive wave displacement
        if (mouse.active) {
          const dx = tile.x - mouse.x;
          const dy = tile.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouseRadius) {
            const proximity = 1 - dist / mouseRadius;
            // Ripple wave radiating outward from pointer
            const ripple = Math.sin(dist * 0.08 - elapsed * 6) * proximity * 0.35;
            alpha = Math.min(1, alpha + proximity * 0.55 + ripple);
            shiftScale += proximity * 0.4;
          }
        }

        if (alpha > 0.03) {
          const currentRadius = baseRadius * shiftScale;

          // Glowing aura on wave peaks
          if (alpha > 0.35) {
            const auraRadius = currentRadius * 2.6;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.28).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(tile.x, tile.y, auraRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Crisp core mosaic tile/dot
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(tile.x, tile.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", initGrid);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    dotSize,
    gridGap,
    waveSpeed,
    waveFrequency,
    backgroundColor,
    minOpacity,
    maxOpacity,
    interactive,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`mosaic-waves-canvas ${className}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default MosaicWaves;
