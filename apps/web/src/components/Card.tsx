export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-border rounded-sm ${className}`}>{children}</div>;
}

export function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-2xl font-semibold text-ink">{title}</h1>
      {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
    </div>
  );
}
