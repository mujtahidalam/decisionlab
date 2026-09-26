"use client";

import { useEffect, useId, useState } from "react";

export interface NumberFieldProps {
  label: string;
  /** Current value in display units. NaN means "the user typed something unparsable". */
  value: number;
  onChange: (value: number) => void;
  help?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  /** Show thousands separators when the field is not focused. */
  grouped?: boolean;
}

const groupedFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function toText(value: number, grouped: boolean): string {
  if (!Number.isFinite(value)) return "";
  return grouped ? groupedFormatter.format(value) : String(value);
}

/** Accepts "75,000", " 75000 ", "3.5". Returns NaN for anything else (including empty). */
export function parseNumberInput(text: string): number {
  const cleaned = text.replace(/[,\s_]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return Number.NaN;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/**
 * Accessible numeric input. Keeps its own text state so users can type freely
 * ("1.", "-", "75,0") without the value snapping back mid-edit.
 */
export function NumberField({
  label,
  value,
  onChange,
  help,
  error,
  prefix,
  suffix,
  grouped = false,
}: NumberFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() => toText(value, grouped));

  // Sync external changes (reset, URL load, scenario) when not mid-edit.
  useEffect(() => {
    if (!focused && Number.isFinite(value) && parseNumberInput(text) !== value) setText(toText(value, grouped));
    // `text` is intentionally excluded: we only react to external value changes.
  }, [value, focused, grouped]);

  const describedBy = error ? errorId : help ? helpId : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div
        className={`mt-1.5 flex items-center rounded-lg border bg-surface transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
          error ? "border-negative" : "border-line-strong"
        }`}
      >
        {prefix ? <span className="pl-3 text-sm text-ink-3" aria-hidden="true">{prefix}</span> : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="tabular w-full min-w-0 bg-transparent px-3 py-2.5 text-base text-ink outline-none sm:text-sm"
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onFocus={() => {
            setFocused(true);
            if (Number.isFinite(value)) setText(String(value));
          }}
          onBlur={() => {
            setFocused(false);
            const parsed = parseNumberInput(text);
            if (Number.isFinite(parsed)) setText(toText(parsed, grouped));
          }}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseNumberInput(e.target.value));
          }}
        />
        {suffix ? <span className="pr-3 text-sm whitespace-nowrap text-ink-3" aria-hidden="true">{suffix}</span> : null}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-negative" role="alert">
          {error}
        </p>
      ) : help ? (
        <p id={helpId} className="mt-1.5 text-xs leading-relaxed text-ink-3">
          {help}
        </p>
      ) : null}
    </div>
  );
}
