import { ReactNode } from 'react';
export type StatusItem = {
  id: string;
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
};
interface StatusDockProps {
  items: StatusItem[];
}
export function StatusDock({ items }: StatusDockProps) {
  const getToneBadge = (tone?: string) => {
    switch (tone) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'danger':
        return 'text-danger';
      default:
        return 'text-ink';
    }
  };

  return (
    <section
      aria-label="Status overview"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="card p-5 group hover:border-border-strong transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">{item.label}</span>
            <div className="text-ink-faint group-hover:text-ink transition-colors">
              {item.icon}
            </div>
          </div>
          <p className={`text-xl font-semibold ${item.tone ? getToneBadge(item.tone) : 'text-ink'}`}>
            {item.value}
          </p>
        </article>
      ))}
    </section>
  );
}
