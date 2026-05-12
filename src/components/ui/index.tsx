import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-4 transition-all duration-300 hover:border-primary/30 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90",
    secondary: "bg-secondary text-white shadow-lg shadow-secondary/20 hover:bg-secondary/90",
    outline: "border border-border bg-transparent hover:bg-surface",
    ghost: "bg-transparent hover:bg-surface text-muted hover:text-foreground",
    danger: "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-xs font-medium text-muted ml-1">{label}</label>}
      <input
        className={`w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info";
}

export function Badge({ children, variant = "info" }: BadgeProps) {
  const variants = {
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    info: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
}
