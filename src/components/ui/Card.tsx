import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  id?: string;
  "aria-labelledby"?: string;
}

export function Card({ children, className = "", as: Tag = "div", ...rest }: CardProps) {
  return (
    <Tag className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, id, action }: { title: string; description?: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
