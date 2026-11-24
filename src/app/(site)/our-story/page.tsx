import { ArrowRight, Heart, Landmark, ShieldCheck, Sparkles, Sprout } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LeafGlyph } from "@/components/home/MarqueeBand";
import { RotatingBadge } from "@/components/home/RotatingBadge";
import { ArchImage } from "@/components/motion/ArchImage";
import { Marquee } from "@/components/motion/Marquee";
import { PageTransition } from "@/components/motion/PageTransition";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Ritan Foods - food is love served on a plate. Traditional South Indian podis, health mixes and malts made with care in Chennai.",
};

const VALUES = [
  { icon: Landmark, title: "Tradition", body: "Preserving our rich food heritage." },
  { icon: Sprout, title: "Health", body: "Encouraging balanced, nutritious food choices." },
  { icon: Sparkles, title: "Quality", body: "Giving importance to carefully selected ingredients and quality." },
  { icon: ShieldCheck, title: "Trust", body: "Building lasting relationships with our customers." },
  { icon: Heart, title: "Care", body: "Approaching every product with dedication." },
];

export default async function OurStoryPage() {
  const products = await getCatalog();

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-50 pb-20 pt-[calc(var(--header-h)+5rem)] lg:pb-28 lg:pt-[calc(var(--header-h)+7rem)]">
        <div className="container-x grid items-end gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow text-leaf-600">Our story</p>
            <h1 className="mt-5 font-display text-display-xl text-forest-900">
              <span className="hero-line line-mask block" style={{ ["--i" as string]: 0 }}>
                <span>Every product has</span>
              </span>
              <span className="hero-line line-mask block" style={{ ["--i" as string]: 1 }}>
                <span>
                  a story of <em className="display-italic text-leaf-500">love.</em>
                </span>
              </span>
            </h1>
            <p className="fade-up mt-8 max-w-xl text-body-lg text-ink-700" style={{ ["--d" as string]: "450ms" }}>
              At Ritan Foods, we believe that food is more than just something we eat. It is love served on a plate, memories shared with family, and traditions passed from one
              generation to another.
            </p>
          </div>
          <div className="relative lg:col-span-5">
            <ArchImage src="/images/editorial/idlis.webp" alt="Soft idlis dusted with idli podi" className="h-[28rem] w-full lg:h-[36rem]" speed={0.2} sizes="(min-width: 1024px) 38vw, 90vw" preload />
            <RotatingBadge className="absolute -bottom-8 -left-8 size-32 sm:size-36" text="A mother's love in every bite · " />
          </div>
        </div>
      </section>

      <section aria-hidden className="overflow-hidden border-y border-forest-900/10 bg-parchment-100 py-6">
        <Marquee speed={45} reverse>
          {["Tradition", "Health", "Quality", "Trust", "Care"].map((t) => (
            <span key={t} className="flex items-center gap-8 pr-8 font-display text-5xl italic text-forest-800/80">
              {t}
              <LeafGlyph className="h-8 w-auto text-leaf-500" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* Journey */}
      <section className="relative overflow-hidden bg-cream-50 py-28 lg:py-40">
        <div className="container-x grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="relative order-2 lg:order-1 lg:col-span-6">
            <div className="relative h-[34rem] sm:h-[40rem] lg:h-[44rem] xl:h-[48rem]">
              <ArchImage src="/images/editorial/millet-bowl.webp" alt="A bowl of golden millet" shape="round" className="absolute left-0 top-0 h-[68%] w-[80%]" speed={-0.14} sizes="(min-width: 1024px) 38vw, 80vw" />
              <ArchImage src="/images/editorial/bananas.webp" alt="A bunch of ripe Nendran bananas" shape="arch" className="absolute bottom-0 right-0 z-10 h-[58%] w-[50%] ring-8 ring-cream-50" speed={0.16} sizes="(min-width: 1024px) 24vw, 50vw" />
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
            <p className="eyebrow text-leaf-600">About us</p>
            <SplitReveal as="h2" className="mt-4 font-display text-display-lg text-forest-900">
              It began with a <em className="display-italic text-leaf-500">simple dream.</em>
            </SplitReveal>
            <Reveal className="mt-8 space-y-5 text-body-lg text-ink-700" stagger={0.1}>
              <p data-reveal-item>
                At Ritan Foods, we believe that food is a symbol of love, family, health, culture and tradition. Our journey began with a simple dream - to bring the goodness of
                traditional Indian foods and thoughtful food choices to every home.
              </p>
              <p data-reveal-item>
                Inspired by our ancestors&apos; food traditions and the goodness of carefully selected ingredients, we offer a variety of products, including Idli Podi, Millet Health
                Mixes, Protein Powders and other traditional and health-focused foods.
              </p>
              <p data-reveal-item>
                We bring together the richness of traditional recipes and the needs of modern lifestyles. Our focus is on ingredient quality, food safety, taste and care in every
                product. We aim to make traditional and nutritious food choices convenient for today&apos;s families.
              </p>
              <p data-reveal-item className="font-display text-2xl italic leading-snug text-forest-800">
                Our dream is to take the goodness of Indian food traditions beyond borders and share them with families around the world.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Vision, mission, values */}
      <section className="relative overflow-hidden bg-forest-900 py-28 text-cream-50 lg:py-40">
        <Parallax speed={-0.3} className="pointer-events-none absolute -right-24 top-0 opacity-[0.07]">
          <LeafGlyph className="h-[36rem] w-auto rotate-[24deg] text-sprout-300" />
        </Parallax>
        <div className="container-x relative">
          <div className="grid gap-12 lg:grid-cols-2">
            <Reveal className="rounded-[2rem] border border-cream-50/10 bg-forest-800/50 p-10">
              <p className="eyebrow text-sprout-300">Our vision</p>
              <p className="mt-5 font-display text-3xl leading-snug lg:text-4xl">To make traditional, nutritious and quality food products accessible to families across the world.</p>
            </Reveal>
            <Reveal className="rounded-[2rem] border border-cream-50/10 bg-forest-800/50 p-10" delay={0.1}>
              <p className="eyebrow text-sprout-300">Our mission</p>
              <p className="mt-5 font-display text-3xl leading-snug lg:text-4xl">
                To celebrate traditional food culture and encourage thoughtful food choices through quality products made with care and dedication.
              </p>
            </Reveal>
          </div>
          <h2 className="mt-24 text-center font-display text-display-md">
            Our <em className="display-italic text-sprout-300">values</em>
          </h2>
          <Reveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5" stagger={0.08}>
            {VALUES.map((v) => (
              <div key={v.title} data-reveal-item className="rounded-[1.75rem] bg-cream-50/5 p-7">
                <v.icon className="size-7 text-sprout-300" />
                <h3 className="mt-6 font-display text-2xl">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-50/70">{v.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Products made with love */}
      <section className="bg-cream-50 py-28 lg:py-40">
        <div className="container-x">
          <p className="eyebrow text-leaf-600">Our products</p>
          <SplitReveal as="h2" className="mt-4 max-w-3xl font-display text-display-lg text-forest-900">
            Made with <em className="display-italic text-leaf-500">love.</em>
          </SplitReveal>
          <Reveal as="ul" className="mt-14 divide-y divide-forest-900/10 border-y border-forest-900/10" stagger={0.05}>
            {products.map((p) => (
              <li key={p.id} data-reveal-item>
                <Link href={`/products/${p.slug}`} className="group grid items-baseline gap-2 py-6 sm:grid-cols-[1fr_1.4fr_auto] sm:gap-8" data-cursor="View">
                  <span className="font-display text-3xl text-forest-900 transition-transform duration-500 group-hover:translate-x-2">{p.name}</span>
                  <span className="text-ink-500">
                    <em className="font-display not-italic text-forest-700">{p.tagline}</em> - {p.summary}
                  </span>
                  <ArrowRight className="hidden size-5 text-forest-700 transition-transform duration-500 group-hover:translate-x-1 sm:block" />
                </Link>
              </li>
            ))}
          </Reveal>
          <Reveal className="mx-auto mt-24 max-w-3xl text-center">
            <p className="eyebrow text-leaf-600">Our heartfelt promise</p>
            <p className="mt-6 font-display text-[clamp(1.8rem,3.2vw,2.8rem)] leading-snug text-forest-900">
              Behind every Ritan Foods product is a simple dream - to bring the taste of tradition, the goodness of nature and the warmth of home to every family.
            </p>
            <p className="mt-8 font-display text-2xl italic text-leaf-500">“We don’t just make food, we create memories with every bite.”</p>
            <ButtonLink href="/shop" size="lg" className="mt-10">
              Shop the pantry <ArrowRight className="size-4" />
            </ButtonLink>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
