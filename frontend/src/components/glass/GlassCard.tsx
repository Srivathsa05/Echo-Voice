import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong";
  glow?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variant === "strong" ? "glass-strong" : "glass",
        "rounded-2xl",
        glow && "shadow-glow",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
