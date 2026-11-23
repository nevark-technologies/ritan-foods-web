import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "peer w-full rounded-2xl border border-forest-900/15 bg-cream-50 px-4 text-[0.97rem] text-ink-900 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-ink-500 hover:border-forest-900/30 focus:border-forest-700 focus:shadow-[0_0_0_4px_rgba(78,143,47,0.15)] aria-[invalid=true]:border-chilli-600 disabled:opacity-60";

export function Field({ label, hint, error, children, className, htmlFor, optional }: { label: string; hint?: string; error?: string | null; children: ReactNode; className?: string; htmlFor: string; optional?: boolean }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-semibold text-forest-900">
        {label}
        {optional && <span className="text-xs font-normal text-ink-500">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs font-semibold text-chilli-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-12", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-32 resize-y py-3", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(control, "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%231e4d2b%22><path d=%22M5.5 7.5 10 12l4.5-4.5%22 stroke=%22%231e4d2b%22 stroke-width=%221.6%22 fill=%22none%22/></svg>')] bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat pr-10", className)} {...props}>
      {children}
    </select>
  );
});
