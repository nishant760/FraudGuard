import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Check } from "lucide-react";
import "./stateful-button.css";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<any> | void;
  status?: "idle" | "loading" | "success";
  loadingText?: string;
  successText?: string;
}

export const Button = ({
  children,
  className = "",
  onClick,
  disabled,
  status: controlledStatus,
  loadingText = "Analyzing...",
  successText = "Assessment Complete",
  type = "button",
  ...props
}: ButtonProps) => {
  const [internalStatus, setInternalStatus] = useState<"idle" | "loading" | "success">("idle");
  const status = controlledStatus ?? internalStatus;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status === "loading") return;

    if (onClick) {
      const result = onClick(e);
      if (result && typeof (result as Promise<any>).then === "function") {
        try {
          setInternalStatus("loading");
          await result;
          setInternalStatus("success");
          setTimeout(() => {
            setInternalStatus("idle");
          }, 2000);
        } catch (error) {
          setInternalStatus("idle");
          throw error;
        }
      }
    }
  };

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || status === "loading"}
      onClick={handleClick}
      className={cn(
        "stateful-button",
        status === "loading" && "stateful-button--loading",
        status === "success" && "stateful-button--success",
        className
      )}
    >
      <span className="stateful-button-content">
        {status === "loading" ? (
          <>
            <Loader2 size={16} className="stateful-spinner" />
            <span>{loadingText}</span>
          </>
        ) : status === "success" ? (
          <>
            <Check size={16} className="stateful-check" />
            <span>{successText}</span>
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
};

export default Button;
