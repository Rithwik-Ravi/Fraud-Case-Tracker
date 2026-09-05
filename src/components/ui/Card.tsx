import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger" | "warning" | "success" | "brand";
}

export default function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const variants = {
    default: "border-ink-200 bg-white shadow-sm",
    danger:  "border-danger-500/40 bg-danger-50 shadow-sm",
    warning: "border-warning-500/40 bg-warning-50 shadow-sm",
    success: "border-success-500/40 bg-success-50 shadow-sm",
    brand:   "border-brand-300/60 bg-brand-50  shadow-sm",
  };

  return (
    <div className={`rounded-ux-xl border p-5 sm:p-6 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
