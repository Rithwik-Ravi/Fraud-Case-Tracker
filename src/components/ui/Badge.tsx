import React from "react";

export type BadgeTone = "success" | "warning" | "danger" | "brand" | "neutral" | string;

export interface BadgeProps {
  variant?: BadgeTone;
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant, tone = "brand", children, className = "" }: BadgeProps) {
  const chosenTone = (variant || tone) as string;

  const toneMap: Record<string, string> = {
    success: "bg-success-100 text-success-700 ring-1 ring-success-300",
    warning: "bg-warning-100 text-warning-800 ring-1 ring-warning-300",
    danger: "bg-danger-100 text-danger-700 ring-1 ring-danger-300",
    brand: "bg-brand-100 text-brand-700 ring-1 ring-brand-300",
    neutral: "bg-ink-100 text-ink-700 ring-1 ring-ink-200",
  };

  const selectedClass = toneMap[chosenTone] || toneMap.brand;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${selectedClass} ${className}`}>
      {children}
    </span>
  );
}
