import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "light" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "group relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-[0.01em] transition-[color,box-shadow,border-color] duration-300 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [transition-property:color,box-shadow,border-color,transform]";

const variants: Record<Variant, { root: string; fill: string }> = {
  primary: { root: "bg-forest-700 text-cream-50 shadow-[0_10px_30px_-12px_rgba(15,42,23,0.6)]", fill: "bg-leaf-500" },
  outline: { root: "border border-forest-700/80 text-forest-800 hover:text-cream-50", fill: "bg-forest-700" },
  light: { root: "bg-cream-50 text-forest-800 hover:text-cream-50", fill: "bg-forest-700" },
  ghost: { root: "text-forest-800 hover:text-forest-900", fill: "bg-sprout-200" },
  gold: { root: "bg-gold-500 text-forest-950", fill: "bg-gold-300" },
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-[0.95rem]",
  lg: "h-14 px-9 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant].root, sizes[size], className);
}

/** Inner content with a rising fill sweep on hover (transform only). */
function Inner({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute left-1/2 top-full -z-10 aspect-square w-[180%] -translate-x-1/2 rounded-full transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[58%] motion-reduce:transition-none",
          variants[variant].fill,
        )}
      />
      <span data-magnetic-inner className="relative flex items-center gap-2">
        {children}
      </span>
    </>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      <Inner variant={variant}>{children}</Inner>
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      <Inner variant={variant}>{children}</Inner>
    </button>
  );
}
