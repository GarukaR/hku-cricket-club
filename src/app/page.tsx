const TOKENS = [
  { name: "accent", label: "Crest green — leads" },
  { name: "red", label: "Crest red — signals results" },
  { name: "ink", label: "Body text" },
  { name: "ink2", label: "Secondary text" },
  { name: "surface", label: "Raised surface" },
  { name: "rule", label: "Hairline" },
];

const DONE = [
  "Three homepage directions, designed and reviewed",
  "Palette generated from the club crest, all 33 contrast pairs clearing WCAG AA",
  "Next.js 16 · React 19 · Tailwind 4 · TypeScript",
  "Fonts self-hosted at build time — no layout shift",
];

const NEXT = [
  "Committee picks a direction",
  "Original logo file, so the crest hexes can be sampled exactly",
  "Sanity CMS and schemas, so the club can publish without touching code",
  "Real content: history, committee, squad, fixtures, photographs",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
        Foundation · not the finished site
      </p>

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl leading-tight text-balance sm:text-5xl">
        Hong Kong University Cricket Club
      </h1>

      <p className="mt-5 max-w-[60ch] text-lg text-[var(--color-ink2)]">
        The site is being rebuilt from the ground up. This page exists to prove the
        foundation works — the colours below come from the club crest and are
        generated, not chosen by eye. Switch your system between light and dark to
        see both themes.
      </p>

      <section className="mt-14">
        <h2 className="font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.16em] text-[var(--color-ink2)]">
          Crest palette
        </h2>
        <ul className="mt-4 grid gap-px overflow-hidden rounded-sm bg-[var(--color-rule)] sm:grid-cols-2">
          {TOKENS.map((t) => (
            <li
              key={t.name}
              className="flex items-center gap-3 bg-[var(--color-surface)] px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="size-6 shrink-0 rounded-full border border-[var(--color-rule)]"
                style={{ background: `var(--color-${t.name})` }}
              />
              <span className="text-sm">
                <code className="font-[family-name:var(--font-data)]">
                  --color-{t.name}
                </code>
                <span className="block text-[var(--color-ink2)]">{t.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        <section>
          <h2 className="font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.16em] text-[var(--color-ink2)]">
            In place
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {DONE.map((item) => (
              <li key={item} className="border-t border-[var(--color-rule)] pt-2">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.16em] text-[var(--color-ink2)]">
            Still needed
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {NEXT.map((item) => (
              <li key={item} className="border-t border-[var(--color-rule)] pt-2">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="mt-16 border-t border-[var(--color-rule)] pt-6 font-[family-name:var(--font-data)] text-xs text-[var(--color-ink2)]">
        Sandy Bay, Pok Fu Lam · Founded 1913
      </footer>
    </main>
  );
}
