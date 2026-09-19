/**
 * Az Admin közös építőelemei (kártya, mezők, gombok) – egységes, nagy,
 * jól kattintható, akadálymentes elemek.
 */
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function AdminPageHeader({
  title,
  description,
  viewHref,
  children,
}: {
  title: string;
  description?: ReactNode;
  /** „Oldal megtekintése” link a publikus oldalra (új lapon). */
  viewHref?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {description && <div className="max-w-3xl text-muted">{description}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {viewHref && (
          <Link
            href={viewHref}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2.5 font-bold text-link hover:bg-bg"
          >
            <ExternalLink aria-hidden className="h-4 w-4" />
            Oldal megtekintése
            <span className="sr-only">(új lapon nyílik meg)</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export function Card({
  title,
  description,
  children,
  className = "",
  actions,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl bg-bg p-5 shadow-sm ring-1 ring-line sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {title && <h2 className="font-display text-xl font-extrabold">{title}</h2>}
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm font-semibold text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-base text-fg placeholder:text-muted/80 disabled:opacity-60";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-28 leading-relaxed ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

/** Be/ki kapcsoló (valójában egy jelölőnégyzet, így billentyűzettel is működik). */
export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer mt-0.5 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-line ring-1 ring-black/10 checked:bg-primary before:mt-0.5 before:ml-0.5 before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow checked:before:ml-[1.35rem]"
      />
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </label>
    </div>
  );
}

type ButtonTone = "primary" | "secondary" | "danger" | "ghost";

const buttonTones: Record<ButtonTone, string> = {
  primary: "bg-primary text-primary-fg hover:brightness-110",
  secondary: "border-2 border-line bg-bg text-fg hover:bg-surface-2",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-fg hover:bg-surface-2",
};

export function Button({
  tone = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold disabled:cursor-not-allowed disabled:opacity-60 ${buttonTones[tone]} ${className}`}
    />
  );
}
