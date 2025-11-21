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
    <article className="card card-hover p-6 group">
      {/* "Top row holds the icon and headings." */}
      <div className="flex items-start gap-4 mb-4">
        {/* "Show the optional icon if one was provided." */}
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <div className="text-primary-600">
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* "Display the main title." */}
          <h3 className="text-base font-semibold text-ink-900 mb-0.5">
            {title}
          </h3>
          {/* "Show the subtitle only when supplied." */}
          {subtitle && (
            <p className="text-xs text-primary-600 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {/* "Describe the action so the user knows what will happen." */}
      <p className="text-sm text-ink-600 leading-relaxed mb-4">
        {description}
      </p>
      {/* "Provide the primary action button that calls the supplied handler." */}
      <button
        type="button"
        onClick={onClick}
        className="btn-primary w-full"
      >
        <span>{ctaLabel}</span>
        {/* "Arrow icon hints that the card leads to a new view." */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </article>
  );
}
