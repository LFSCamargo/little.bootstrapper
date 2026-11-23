export const DOC_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cli-commands', label: 'CLI commands' },
  { id: 'starter-product', label: 'Starter product' },
  { id: 'ai-ecosystem', label: 'AI ecosystem' },
  { id: 'security', label: 'Security' },
  { id: 'delivery-pipeline', label: 'Delivery pipeline' },
  { id: 'blueprint', label: 'Project blueprint' },
  { id: 'architecture-patterns', label: 'Architecture patterns' },
];

export function DocsNavigation() {
  return (
    <aside className="sticky top-28 z-40 min-w-0 self-start rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl lg:top-32 lg:p-5 dark:border-zinc-800 dark:bg-zinc-950/95">
      <p className="mb-4 hidden text-xs font-semibold uppercase tracking-widest text-zinc-500 lg:block">
        On this page
      </p>
      <nav aria-label="Documentation sections" className="max-h-[calc(100dvh-10rem)] overflow-auto">
        <ul className="flex gap-1 lg:flex-col">
          {DOC_SECTIONS.map((section) => (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-teal-500/10 hover:text-teal-700 focus-visible:outline-teal-500 dark:text-zinc-400 dark:hover:text-teal-300"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
