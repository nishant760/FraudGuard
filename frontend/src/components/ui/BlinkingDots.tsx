import React, { useEffect, useRef } from 'react';

export interface BlinkingDotsProps {
  /** Size of each dot in pixels (default: 1.2) */
  dotSize?: number;
  /** Gap between dot grid lines in pixels (default: 12) */
  gridGap?: number;
  /** Speed of the blinking / twinkling oscillation (default: 0.8) */
  twinkleSpeed?: number;
  /** Intensity of the twinkle variation between 0 and 1 (default: 0.85) */
  twinkleStrength?: number;
  /** Color of the dots - hex or rgb (default: '#4ade80') */
  color?: string;
  /** Background color behind the grid (default: 'transparent') */
  backgroundColor?: string;
  /** Minimum baseline brightness/opacity of a dot (default: 0.08) */
  minBrightness?: number;
  /** Maximum peak brightness/opacity of a blinking dot (default: 0.95) */
  maxOpacity?: number;
  /** Whether mouse movement influences dot brightness (default: true) */
  interactive?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Additional inline CSS styles */
  style?: React.CSSProperties;
}

/**
 * BlinkingDots Component
 * 
 * Crisp field of tiny dots blinking in and out on a fixed grid (React Bits Pro style).
 * Renders a high-density, performant HTML5 canvas matrix of twinkling dots.
 */
export const BlinkingDots: React.FC<BlinkingDotsProps> = ({
  dotSize = 1.3,
  gridGap = 11,
  twinkleSpeed = 0.75,
  twinkleStrength = 0.85,
  color = '#10b981', // Crisp vibrant emerald/green dots for white background
  backgroundColor = '#ffffff', // Clean white background
  minBrightness = 0.08,
  maxOpacity = 0.9,
  interactive = true,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetColorRef = useRef(color);
  useEffect(() => {
    targetColorRef.current = color;
  }, [color]);

  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Helper: robustly parse 3, 4, 6, 8-digit hex or rgb
    const parseColor = (col: string): [number, number, number] => {
      if (col.startsWith('#')) {
        let hex = col.slice(1);
        if (hex.length === 3 || hex.length === 4) {
          hex = hex
            .split('')
            .map((c) => c + c)
            .join('');
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
      return [16, 185, 129]; // default #10b981
    };

    const [initR, initG, initB] = parseColor(targetColorRef.current);
    let currentR = initR;
    let currentG = initG;
    let currentB = initB;

    interface DotData {
      x: number;
      y: number;
      phase: number;
      speed: number;
      bias: number;
    }

    let dots: DotData[] = [];

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

      dots = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          dots.push({
            x: col * cellSize,
            y: row * cellSize,
            phase: Math.random() * Math.PI * 2,
            speed: (0.3 + Math.random() * 1.0) * twinkleSpeed,
            bias: Math.random() < 0.12 ? 0.25 : 0.0, // selective brighter star clusters
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
      window.addEventListener('resize', initGrid);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      // Smoothly interpolate RGB toward target color
      const [targetR, targetG, targetB] = parseColor(targetColorRef.current);
      currentR += (targetR - currentR) * 0.08;
      currentG += (targetG - currentG) * 0.08;
      currentB += (targetB - currentB) * 0.08;

      const r = Math.round(currentR);
      const g = Math.round(currentG);
      const b = Math.round(currentB);

      ctx.clearRect(0, 0, width, height);

      if (backgroundColor && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      const mouse = mouseRef.current;
      const hoverRadius = 130;
      const radius = dotSize / 2;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        // Harmonic twinkle oscillation wave
        const wave = Math.sin(elapsed * dot.speed + dot.phase);
        const norm = (wave + 1) * 0.5;
        const twinkle = Math.pow(norm, 2.5);

        // Clamped twinkle strength and higher brightness
        const strength = Math.min(Math.max(twinkleStrength, 0.1), 3.0);
        let alpha = Math.min(1, minBrightness + twinkle * strength * (maxOpacity - minBrightness) + dot.bias * 0.25);

        // Interactive mouse proximity boost
        if (mouse.active) {
          const dist = Math.hypot(dot.x - mouse.x, dot.y - mouse.y);
          if (dist < hoverRadius) {
            const proximity = 1 - dist / hoverRadius;
            alpha = Math.min(1, alpha + proximity * 0.6);
          }
        }

        if (alpha > 0.02) {
          // Subtle, elegant glowing halo for active/peaking dots
          if (alpha > 0.20) {
            const haloRadius = radius * 2.7;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.36).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, haloRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Crisp shiny core dot
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', initGrid);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    dotSize,
    gridGap,
    twinkleSpeed,
    twinkleStrength,
    backgroundColor,
    minBrightness,
    maxOpacity,
    interactive,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`blinking-dots-canvas ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default BlinkingDots;
