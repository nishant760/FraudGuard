import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import GlowingCard from "./GlowingCard";
import "./ModalCard.css";

export interface ModalCardProps {
  title: string;
  subtitle?: string;
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
  borderRadius?: string;
  className?: string;
  children: React.ReactNode;
  modalContent?: React.ReactNode;
  expandLabel?: string;
}

/**
 * ModalCard Component (React Bits Pro style)
 * 
 * Expandable card that opens into a full-screen blurred backdrop modal with deep dive content.
 */
export const ModalCard: React.FC<ModalCardProps> = ({
  title,
  subtitle,
  fromColor = "rgba(99, 102, 241, 0.35)",
  viaColor = "rgba(168, 85, 247, 0.25)",
  toColor = "rgba(59, 130, 246, 0.35)",
  borderRadius = "var(--radius-lg, 16px)",
  className = "",
  children,
  modalContent,
  expandLabel = "Expand",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Card */}
      <div
        className={`modal-card-trigger ${className}`}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <GlowingCard
          fromColor={fromColor}
          viaColor={viaColor}
          toColor={toColor}
          borderRadius={borderRadius}
          className="h-full"
        >
          <div className="card" style={{ border: "none", background: "transparent", boxShadow: "none", height: "100%" }}>
            <div className="card-header">
              <div>
                <div className="card-title">{title}</div>
                {subtitle && <div className="card-subtitle">{subtitle}</div>}
              </div>
              <div className="modal-card-expand-badge">
                <Maximize2 size={12} />
                <span>{expandLabel}</span>
              </div>
            </div>
            {children}
          </div>
        </GlowingCard>
      </div>

      {/* Expanded Modal */}
      {isOpen &&
        createPortal(
          <div
            className="modal-card-backdrop"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-card-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-card-header">
                <div>
                  <h2 className="modal-card-title">{title}</h2>
                  {subtitle && <p className="modal-card-subtitle">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  className="modal-card-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-card-body">
                {modalContent || children}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ModalCard;
