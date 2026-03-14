import { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
  bodyClassName = "",
}: CardProps) {
  return (
    <section
      className={`w-full rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {(title || subtitle || right) && (
        <header className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="mt-1 text-sm text-slate-600">
                {subtitle}
              </div>
            )}
          </div>

          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}

      <div className={`px-6 py-6 lg:px-8 lg:py-7 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}