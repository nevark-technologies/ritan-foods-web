import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { getPolicy, POLICIES } from "@/lib/content/policies";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  return policy ? { title: policy.title, description: policy.summary } : {};
}

export default function PolicyPage(props: PageProps<"/policies/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-[80vh] bg-cream-50" />}>
        <PolicyContent {...props} />
      </Suspense>
    </PageTransition>
  );
}

async function PolicyContent({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <>
      <section className="bg-cream-50 pb-24 pt-[calc(var(--header-h)+4.5rem)] lg:pb-32 lg:pt-[calc(var(--header-h)+6rem)]">
        <div className="container-x grid gap-14 lg:grid-cols-[16rem_1fr] lg:gap-20">
          <nav aria-label="Policies" className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow text-leaf-600">Policies</p>
            <ul className="mt-5 space-y-1">
              {POLICIES.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/policies/${p.slug}`}
                    aria-current={p.slug === policy.slug ? "page" : undefined}
                    className={cn("block rounded-full px-4 py-2 text-sm font-semibold transition-colors", p.slug === policy.slug ? "bg-forest-800 text-cream-50" : "text-forest-800 hover:bg-forest-900/5")}
                  >
                    {p.title.replace(" Policy", "")}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="block rounded-full px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-900/5">
                  Contact us
                </Link>
              </li>
            </ul>
          </nav>
          <article className="max-w-3xl">
            <h1 className="font-display text-display-md text-forest-900">{policy.title}</h1>
            <p className="mt-4 text-body-lg text-ink-700">{policy.summary}</p>
            <p className="mt-2 text-sm text-ink-500">Last updated {policy.updated}</p>
            <div className="mt-12 space-y-10">
              {policy.sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="font-display text-2xl text-forest-900">{s.heading}</h2>
                  {s.paragraphs?.map((p, i) => (
                    <p key={i} className="mt-3 leading-relaxed text-ink-700">
                      {p}
                    </p>
                  ))}
                  {s.bullets && (
                    <ul className="mt-3 space-y-2">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex gap-3 leading-relaxed text-ink-700">
                          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-leaf-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
