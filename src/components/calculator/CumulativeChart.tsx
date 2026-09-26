"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { linearScale, niceTicks } from "@/lib/chart/scale";
import { formatCurrencyCompact, formatSignedCurrency, type CurrencyCode } from "@/lib/format";

export interface ChartSeries {
  id: string;
  label: string;
  /** CSS colour, typically `var(--series-n)`. */
  color: string;
  points: readonly { t: number; advantage: number }[];
}

/** How a calculator's time axis should be labelled. Times are in years from t = 0. */
export interface ChartTimeAxis {
  /** Optional shaded period from t = 0 (e.g. studying, or the gap between jobs). */
  phase?: { end: number; label: string };
  /** Optional vertical rule marking a key event (e.g. graduation). */
  marker?: { t: number; label: string };
  /** x-axis tick label, e.g. t => (t === 0 ? "Start" : `Yr ${t}`). */
  tickLabel: (t: number) => string;
  /** Tooltip heading for a hovered time. */
  describeTime: (t: number) => string;
  /** Rows of the accessible data table. */
  table: { header: string; times: readonly number[]; label: (t: number) => string };
  /** Plain-language explanation shown under the chart. */
  caption: string;
}

export interface CumulativeChartProps {
  series: readonly ChartSeries[];
  axis: ChartTimeAxis;
  currency: CurrencyCode;
  title: string;
}

const HEIGHT = 300;
const MARGIN = { top: 28, right: 96, bottom: 36, left: 64 };

/** Binary search for the point with t closest to `t`. */
function nearest(points: readonly { t: number; advantage: number }[], t: number) {
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid]!.t < t) lo = mid;
    else hi = mid;
  }
  const a = points[lo]!;
  const b = points[hi]!;
  return Math.abs(a.t - t) <= Math.abs(b.t - t) ? a : b;
}

/** Spreads end-of-line labels vertically so they never overlap. */
function spreadLabels(ys: number[], minGap: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) {
    if (order[k]!.y - order[k - 1]!.y < minGap) order[k]!.y = order[k - 1]!.y + minGap;
  }
  const out = new Array<number>(ys.length);
  for (const o of order) out[o.i] = o.y;
  return out;
}

/**
 * Line chart of cumulative advantage over time for one or more scenarios.
 * Renders in real pixels (ResizeObserver) so text stays legible on phones.
 */
export function CumulativeChart({ series, axis, currency, title }: CumulativeChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hoverT, setHoverT] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = width < 480;
  const margin = compact ? { ...MARGIN, right: 16, left: 52 } : MARGIN;
  const innerW = width - margin.left - margin.right;
  const innerH = HEIGHT - margin.top - margin.bottom;

  const { x, y, yTicks, xTicks, tMax } = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    const tMax = Math.max(...all.map((p) => p.t), 1);
    const values = all.map((p) => p.advantage);
    const yTicks = niceTicks(Math.min(0, ...values), Math.max(0, ...values), 5);
    const xTicks = niceTicks(0, tMax, compact ? 4 : 8).filter((t) => t >= 0 && t <= tMax + 1e-9);
    return {
      tMax,
      yTicks,
      xTicks,
      x: linearScale(0, tMax, 0, innerW),
      y: linearScale(yTicks[0]!, yTicks[yTicks.length - 1]!, innerH, 0),
    };
  }, [series, innerW, innerH, compact]);

  const paths = series.map((s) => s.points.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.advantage).toFixed(1)}`).join(""));
  const endYs = spreadLabels(
    series.map((s) => y(s.points[s.points.length - 1]!.advantage)),
    14,
  );

  const hovered = hoverT === null ? null : series.map((s) => ({ s, p: nearest(s.points, hoverT) }));
  const hoverX = hovered?.[0] ? x(hovered[0].p.t) : 0;

  const onPointer = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    setHoverT(Math.min(tMax, Math.max(0, (px / rect.width) * tMax)));
  };


  return (
    <figure className="m-0">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2" aria-hidden="true">
        {series.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div ref={wrapRef} className="relative w-full">
        <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={title} className="block h-auto w-full overflow-visible">
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Phase shading and event marker */}
            {axis.phase && axis.phase.end > 0 ? (
              <>
                <rect x={0} y={0} width={Math.max(0, x(axis.phase.end))} height={innerH} fill="var(--surface-2)" />
                {/* Skip the label when the phase is too narrow to hold it without colliding with the marker label. */}
                {x(axis.phase.end) > 90 ? (
                  <text x={4} y={-10} fontSize={11} fill="var(--ink-3)">
                    {axis.phase.label}
                  </text>
                ) : null}
              </>
            ) : null}
            {axis.marker ? (
              <>
                <line x1={x(axis.marker.t)} x2={x(axis.marker.t)} y1={-4} y2={innerH} stroke="var(--line-strong)" strokeDasharray="3 3" />
                <text
                  x={x(axis.marker.t) + 4}
                  y={-10}
                  fontSize={11}
                  fill="var(--ink-3)"
                >
                  {axis.marker.label}
                </text>
              </>
            ) : null}

            {/* Grid + y axis */}
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={0} x2={innerW} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--line-strong)" : "var(--grid)"} strokeWidth={v === 0 ? 1.5 : 1} />
                <text x={-8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--ink-3)" className="tabular">
                  {formatCurrencyCompact(v, currency)}
                </text>
              </g>
            ))}

            {/* x axis */}
            {xTicks.map((t) => (
              <text key={t} x={x(t)} y={innerH + 20} textAnchor="middle" fontSize={11} fill="var(--ink-3)" className="tabular">
                {axis.tickLabel(t)}
              </text>
            ))}

            {/* Lines */}
            {series.map((s, i) => (
              <path key={s.id} d={paths[i]} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}

            {/* Direct labels at line ends (wide screens only) */}
            {!compact &&
              series.map((s, i) => (
                <text key={s.id} x={innerW + 8} y={endYs[i]} dy="0.32em" fontSize={11} fill="var(--ink-2)">
                  {s.label}
                </text>
              ))}

            {/* Hover layer */}
            {hovered ? (
              <g pointerEvents="none">
                <line x1={hoverX} x2={hoverX} y1={0} y2={innerH} stroke="var(--ink-3)" strokeWidth={1} />
                {hovered.map(({ s, p }) => (
                  <circle key={s.id} cx={x(p.t)} cy={y(p.advantage)} r={4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </g>
            ) : null}
            <rect
              x={0}
              y={0}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={onPointer}
              onPointerDown={onPointer}
              onPointerLeave={() => setHoverT(null)}
            />
          </g>
        </svg>

        {hovered?.[0] ? (
          <div
            className="pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-line bg-surface p-3 text-xs shadow-lg"
            style={{
              left: Math.min(width - 216, Math.max(0, margin.left + hoverX + (hoverX > innerW / 2 ? -220 : 12))),
            }}
          >
            <p className="font-medium text-ink">
              {axis.describeTime(hovered[0].p.t)}
            </p>
            <ul className="mt-1.5 space-y-1">
              {hovered.map(({ s, p }) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-ink-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="tabular font-medium text-ink">{formatSignedCurrency(p.advantage, currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-2 text-xs text-ink-3">{axis.caption}</figcaption>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-ink-2 hover:text-ink">Show data table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="tabular w-full min-w-[420px] text-right">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="text-ink-3">
                <th scope="col" className="py-1 text-left font-medium">{axis.table.header}</th>
                {series.map((s) => (
                  <th key={s.id} scope="col" className="py-1 font-medium">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {axis.table.times.map((t) => (
                <tr key={t} className="border-t border-line">
                  <th scope="row" className="py-1 text-left font-normal text-ink-2">
                    {axis.table.label(t)}
                  </th>
                  {series.map((s) => (
                    <td key={s.id} className="py-1 text-ink">{formatSignedCurrency(nearest(s.points, t).advantage, currency)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
