"use client";

/**
 * Shared client state for every calculator page:
 * - inputs + currency state, validated on every change
 * - loads shared state from the URL (and `?session=<id>` saved calculations) after hydration
 * - keeps the URL in sync so any valid state is a shareable link
 * - saves calculations to the database via the sessions API
 * - keeps showing the last valid results while an input is being corrected
 *
 * Calculators supply their own defaults, codec, validation and compute function;
 * all math stays in the pure engine modules.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCalculatorSession, saveCalculatorSession } from "@/lib/api-client/sessions";
import type { ParseResult } from "@/lib/calculators/framework/input-parsing";
import type { UrlCodec } from "@/lib/calculators/framework/url-state";
import type { ValidationResult } from "@/lib/calculators/types";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/format";

export const SESSION_PARAM = "session";
const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ActiveSession<I> {
  id: string;
  inputs: I;
  createdAt: string;
}

export type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

export interface CalculatorControllerConfig<K extends string, I extends Record<K, number>, C> {
  slug: string;
  defaults: Readonly<I>;
  codec: UrlCodec<I>;
  validate: (inputs: I) => ValidationResult<K>;
  parseInputs: (raw: unknown) => ParseResult<I>;
  compute: (inputs: I) => C;
}

const sameInputs = (a: Record<string, number>, b: Record<string, number>) => Object.keys(a).every((k) => a[k] === b[k]);

export function useCalculatorController<K extends string, I extends Record<K, number>, C>(
  config: CalculatorControllerConfig<K, I, C>,
) {
  const { slug, defaults, codec, validate, parseInputs, compute } = config;
  const [inputs, setInputs] = useState<I>({ ...defaults });
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [hydrated, setHydrated] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession<I> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load from the URL once, after hydration, so pages stay statically renderable.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = codec.parse(params);
    setInputs(state.inputs);
    setCurrency(state.currency);

    const sessionId = params.get(SESSION_PARAM);
    if (!sessionId) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = SESSION_ID_RE.test(sessionId)
        ? await fetchCalculatorSession(sessionId)
        : ({ ok: false, error: "Session not found." } as const);
      if (cancelled) return;
      const parsed = result.ok && result.data.calculatorSlug === slug ? parseInputs(result.data.inputs) : null;
      if (result.ok && parsed?.ok) {
        setInputs(parsed.inputs);
        setActiveSession({ id: result.data.id, inputs: parsed.inputs, createdAt: result.data.createdAt });
      } else {
        setLoadError("That saved calculation couldn't be loaded. Showing default values instead.");
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // Runs once on mount; config objects are module constants.
  }, []);

  const validation = useMemo(() => validate(inputs), [validate, inputs]);
  const sessionIsCurrent = activeSession !== null && sameInputs(activeSession.inputs, inputs);

  // Keep the URL in sync with valid inputs (a saved session is referenced by id instead).
  useEffect(() => {
    if (!hydrated || !validation.valid) return;
    const params = new URLSearchParams(codec.serialize({ inputs: sessionIsCurrent ? defaults : inputs, currency }));
    if (sessionIsCurrent) params.set(SESSION_PARAM, activeSession.id);
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [codec, defaults, inputs, currency, hydrated, validation.valid, sessionIsCurrent, activeSession]);

  // Results: recompute on valid inputs; otherwise keep the last valid results on screen.
  const lastGood = useRef<C | null>(null);
  const computed = useMemo(() => {
    if (validation.valid) lastGood.current = compute(inputs);
    return lastGood.current ?? compute(defaults as I);
  }, [compute, defaults, inputs, validation.valid]);

  const setInput = useCallback((key: K, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setInputs({ ...defaults });
    setCurrency(DEFAULT_CURRENCY);
  }, [defaults]);

  const save = useCallback(async () => {
    if (!validation.valid) return;
    setSaveState({ status: "saving" });
    const snapshot = { ...inputs };
    const result = await saveCalculatorSession(slug, snapshot);
    if (result.ok) {
      setActiveSession({ id: result.data.id, inputs: snapshot, createdAt: result.data.createdAt });
      setSaveState({ status: "idle" });
    } else {
      setSaveState({ status: "error", message: result.error });
    }
  }, [inputs, slug, validation.valid]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable (e.g. insecure context): the address bar already holds the link. */
    }
  }, []);

  return {
    inputs,
    setInput,
    currency,
    setCurrency,
    reset,
    validation,
    stale: !validation.valid,
    computed,
    session: { active: activeSession, isCurrent: sessionIsCurrent, saveState, save, loadError, copyLink, copied },
  };
}

export type CalculatorSessionControls = ReturnType<typeof useCalculatorController>["session"];
