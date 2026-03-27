"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HelpCenterView, HelpPresetTag, HelpSectionView } from "@/content/help-center";
import { helpArticleSearchHaystack } from "@/content/help-center";
import type { Locale } from "@/lib/i18n/locales";
import { HelpStatusBadge } from "./help-status-badge";
import { RichLine } from "./rich-line";

type HelpCenterClientProps = {
  locale: Locale;
  bundle: HelpCenterView & { sections: HelpSectionView[] };
};

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function articleMatches(
  article: HelpSectionView["articles"][number],
  locale: Locale,
  query: string,
  preset: HelpPresetTag | null,
): boolean {
  if (preset && !article.presetTags.includes(preset)) return false;
  if (!query) return true;
  const hay = helpArticleSearchHaystack(article, locale);
  const parts = query.split(/\s+/).filter(Boolean);
  return parts.every((p) => hay.includes(p));
}

export function HelpCenterClient({ locale, bundle }: HelpCenterClientProps) {
  const [query, setQuery] = useState("");
  const [preset, setPreset] = useState<HelpPresetTag | null>(null);
  const q = normalizeQuery(query);

  const filteredSections = useMemo(() => {
    return bundle.sections
      .map((sec) => ({
        ...sec,
        articles: sec.articles.filter((a) => articleMatches(a, locale, q, preset)),
      }))
      .filter((sec) => sec.articles.length > 0);
  }, [bundle.sections, locale, q, preset]);

  const totalMatches = useMemo(
    () => filteredSections.reduce((n, s) => n + s.articles.length, 0),
    [filteredSections],
  );

  const resultsHint =
    totalMatches === 0
      ? bundle.resultsEmpty
      : bundle.resultsCountTemplate.replace("{count}", String(totalMatches));

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <label htmlFor="help-search" className="block text-sm font-medium text-foreground">
          {bundle.searchLabel}
        </label>
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={bundle.searchPlaceholder}
          autoComplete="off"
          className="w-full max-w-xl rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-describedby="help-search-hint"
        />
        <p id="help-search-hint" className="text-caption text-muted-foreground">
          {resultsHint}
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Popular topics">
          {bundle.presetChips.map(({ tag, label }) => {
            const active = preset === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setPreset(active ? null : tag)}
                className={`rounded-full border px-3 py-1.5 text-caption font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-14">
        {filteredSections.map((section) => (
          <section key={section.id} className="space-y-6" aria-labelledby={`help-sec-${section.id}`}>
            <h2 id={`help-sec-${section.id}`} className="text-subheading font-semibold text-foreground md:text-h3">
              {section.title}
            </h2>
            <ul className="space-y-10">
              {section.articles.map((article) => (
                <li key={article.id} id={`article-${article.id}`} className="scroll-mt-24">
                  <article className="max-w-[65ch] space-y-3 border-b border-border pb-10 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold leading-snug text-foreground md:text-xl">{article.title}</h3>
                      <HelpStatusBadge status={article.status} labels={bundle.statusLabels} />
                    </div>
                    <div className="space-y-3 text-body leading-body-relaxed text-muted-foreground">
                      {article.body.map((para, i) => (
                        <p key={i}>
                          <RichLine text={para} />
                        </p>
                      ))}
                    </div>
                    {article.cta ? (
                      <p>
                        <Link
                          href={article.cta.href}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {article.cta.label} →
                        </Link>
                      </p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside
        className="max-w-[65ch] rounded-xl border border-border bg-muted/15 px-4 py-4 text-body leading-relaxed text-muted-foreground"
        role="note"
      >
        <RichLine text={bundle.roadmapFoot.lead} />
        <p className="mt-2">
          <Link
            href={bundle.roadmapFoot.href}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {bundle.roadmapFoot.cta} →
          </Link>
        </p>
      </aside>
    </div>
  );
}
