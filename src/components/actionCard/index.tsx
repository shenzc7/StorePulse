interface ActionCardProps {
  title: string;
  subtitle?: string;
  description: string;
  ctaLabel: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}
export function ActionCard({
  title,
  subtitle,
  description,
  ctaLabel,
  onClick,
  icon,
}: ActionCardProps) {
  return (
    <article className="card p-5 group hover:border-border-strong transition-all">
      {/* "Top row holds the icon and headings." */}
      <div className="flex items-start gap-4 mb-4">
        {/* "Show the optional icon if one was provided." */}
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-surface-active flex items-center justify-center border border-border flex-shrink-0">
            <div className="text-ink">
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* "Display the main title." */}
          <h3 className="text-sm font-medium text-ink mb-0.5">
            {title}
          </h3>
          {/* "Show the subtitle only when supplied." */}
          {subtitle && (
            <p className="text-xs text-ink-muted font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {/* "Describe the action so the user knows what will happen." */}
      <p className="text-xs text-ink-muted leading-relaxed mb-4">
        {description}
      </p>
      {/* "Provide the primary action button that calls the supplied handler." */}
      <button
        type="button"
        onClick={onClick}
        className="btn-secondary w-full justify-between group-hover:bg-surface-hover"
      >
        <span>{ctaLabel}</span>
        {/* "Arrow icon hints that the card leads to a new view." */}
        <svg className="w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </article>
  );
}
