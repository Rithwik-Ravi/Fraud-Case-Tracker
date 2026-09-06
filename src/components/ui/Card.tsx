import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger" | "warning" | "success" | "brand" | "panel" | "subtle";
}

export default function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  // Stark, functional styles without generic fuzzy drop-shadows
  const variants = {
    default: "border border-ink-200 bg-white",
    subtle:  "border border-ink-200 bg-ink-50",
    panel:   "border-l-4 border-ink-900 bg-ink-50 border-y border-r border-ink-200",
    danger:  "border-l-4 border-danger-500 bg-danger-50 border-y border-r border-danger-200",
    warning: "border-l-4 border-warning-500 bg-warning-50 border-y border-r border-warning-200",
    success: "border-l-4 border-success-500 bg-success-50 border-y border-r border-success-200",
    brand:   "border-l-4 border-brand-500 bg-brand-50 border-y border-r border-brand-200",
  };

  return (
    <div className={`rounded-ux p-5 sm:p-6 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
