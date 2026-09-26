/** Non-blocking input warnings, each with an icon + text (never colour alone). */
export function WarningList({ warnings }: { warnings: readonly string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {warnings.map((w) => (
        <li key={w} className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
          <span aria-hidden="true">⚠ </span>
          {w}
        </li>
      ))}
    </ul>
  );
}
