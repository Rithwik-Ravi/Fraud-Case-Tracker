import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function Button({ href, variant = "primary", size = "md", children, className = "", ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-ux font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
    secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
    outline: "bg-white text-brand-700 border-2 border-brand-500 hover:bg-brand-50",
    danger: "bg-danger-500 text-white hover:bg-danger-600",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-5 py-3 text-lg",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
