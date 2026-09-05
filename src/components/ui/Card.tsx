import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger" | "warning";
}

export default function Card({ children, className = "", variant = "default" }: CardProps) {
  const variants = {
    default: "border-ink-200 bg-white",
    danger: "border-danger-500/30 bg-danger-50/50",
    warning: "border-warning-500/30 bg-warning-50/50",
  };

  return (
    <div className={`rounded-ux-xl border p-5 sm:p-6 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
