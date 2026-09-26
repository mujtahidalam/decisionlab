"use client";

import type { SaveState } from "@/features/shared/useCalculatorController";

export interface SaveShareBarProps {
  disabled: boolean;
  isSaved: boolean;
  savedAt: string | null;
  saveState: SaveState;
  loadError: string | null;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
  methodologyHref?: string;
}

/** Save / copy-link / methodology actions plus status messages, shared by every calculator. */
export function SaveShareBar({ disabled, isSaved, savedAt, saveState, loadError, copied, onSave, onCopy, methodologyHref = "#how-it-works" }: SaveShareBarProps) {
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || isSaved || saveState.status === "saving"}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveState.status === "saving" ? "Saving…" : isSaved ? "Saved ✓" : "Save calculation"}
        </button>
        <button type="button" onClick={onCopy} className="rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2">
          {copied ? "Link copied" : "Copy link"}
        </button>
        <a href={methodologyHref} className="rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2">
          How this is calculated
        </a>
      </div>
      <div aria-live="polite" className="mt-3 text-xs">
        {isSaved && savedAt ? (
          <p className="text-ink-2">
            Saved calculation from {new Date(savedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}. The page link now opens
            it; editing any input starts a new, unsaved calculation.
          </p>
        ) : null}
        {saveState.status === "error" ? <p className="text-negative">Couldn&apos;t save: {saveState.message}</p> : null}
        {loadError ? <p className="text-negative">{loadError}</p> : null}
      </div>
    </>
  );
}
