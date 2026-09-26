/** DecisionLens wordmark: a simple lens glyph plus the product name. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-accent">
        <circle cx="10.5" cy="10.5" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M6.5 12.5l2.5-2.5 2 2 3.5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span>DecisionLens</span>
    </span>
  );
}
