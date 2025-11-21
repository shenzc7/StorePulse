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
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'danger':
        return 'badge-danger';
      default:
        return 'badge-neutral';
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
          className="stat-card group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">{item.label}</span>
            {item.icon}
          </div>
          <p className={`text-xl font-semibold text-ink-900 ${item.tone ? getToneBadge(item.tone) : ''}`}>
            {item.value}
          </p>
        </article>
      ))}
    </section>
  );
}
