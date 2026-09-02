import type React from "react";
import { cn } from "@/lib/utils";
import "./GlowingCard.css";

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Starting gradient color.
   */
  fromColor?: string;
  /**
   * Middle gradient color.
   */
  viaColor?: string;
  /**
   * Ending gradient color.
   */
  toColor?: string;
  /**
   * Border radius of the card (default 16px).
   */
  borderRadius?: string;
  /**
   * Opacity of the background glow layer on hover (default 0.35).
   */
  glowOpacity?: number;
  children?: React.ReactNode;
}

export default function GlowingCard({
  fromColor = "rgba(99, 102, 241, 0.35)",
  viaColor = "rgba(168, 85, 247, 0.25)",
  toColor = "rgba(59, 130, 246, 0.35)",
  borderRadius = "16px",
  glowOpacity = 0.35,
  className = "",
  children,
  style,
  ...props
}: GlowCardProps) {
  const gradient = `linear-gradient(135deg, ${fromColor}, ${viaColor}, ${toColor})`;

  return (
    <div
      className={cn("glowing-card-wrapper", className)}
      style={{
        borderRadius,
        padding: "1.2px",
        background: gradient,
        ...style,
      }}
      {...props}
    >
      {/* Subtle background blur glow on hover */}
      <div
        aria-hidden="true"
        className="glowing-card-glow"
        style={{
          borderRadius,
          background: gradient,
          opacity: 0,
        }}
      />
      {/* Inner card content with theme background */}
      <div
        className="glowing-card-content"
        style={{
          borderRadius: `calc(${borderRadius} - 1.2px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
