import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/contact/ContactForm";
import { Marquee } from "@/components/motion/Marquee";
import { PageTransition } from "@/components/motion/PageTransition";
import { Parallax } from "@/components/motion/Parallax";
import { getCatalog, getStoreSettings } from "@/lib/data/queries";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Ritan Foods — call, WhatsApp or email us. We're happy to help with orders, products and deliveries.",
};

export default async function ContactPage() {
  const [settings, products] = await Promise.all([getStoreSettings(), getCatalog()]);
  const c = settings.contact;
  const left = products.find((p) => p.slug === "abc-malt");
  const right = products.find((p) => p.slug === "curry-leaf-rice-mix");
  const cards = [
    { icon: Phone, label: "Call us", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: whatsappLink(c.whatsapp, "Hi Ritan Foods!") },
    { icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}` },
    { icon: MapPin, label: "Registered office", value: c.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` },
  ];

  return (
    <PageTransition>
      <section className="bg-cream-50 pb-16 pt-[calc(var(--header-h)+5rem)] text-center lg:pt-[calc(var(--header-h)+7rem)]">
        <div className="container-x">
          <p className="eyebrow text-leaf-600">Contact</p>
          <h1 className="mx-auto mt-5 max-w-5xl font-display text-display-xl text-forest-900">
            <span className="hero-line line-mask block" style={{ ["--i" as string]: 0 }}>
              <span>We&apos;d love to</span>
            </span>
            <span className="hero-line line-mask block" style={{ ["--i" as string]: 1 }}>
              <span>
                hear from <em className="display-italic text-leaf-500">you.</em>
              </span>
            </span>
          </h1>
          <p className="fade-up mx-auto mt-6 max-w-lg text-body-lg text-ink-700" style={{ ["--d" as string]: "400ms" }}>
            Questions about an order, a product or a delivery? Our friendly team is always here to help.
          </p>
          <ul className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <li key={card.label}>
                <a
                  href={card.href}
                  target={card.href.startsWith("http") ? "_blank" : undefined}
                  rel={card.href.startsWith("http") ? "noopener" : undefined}
                  className="group flex h-full flex-col items-center gap-3 rounded-[1.75rem] border border-forest-900/10 bg-parchment-100 px-5 py-7 transition-transform duration-500 hover:-translate-y-1"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-forest-800 text-cream-50 transition-transform duration-500 group-hover:scale-110">
                    <card.icon className="size-5" />
                  </span>
                  <span className="eyebrow text-ink-500">{card.label}</span>
                  <span className="text-sm font-semibold text-forest-900 [overflow-wrap:anywhere]">{card.value}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-3xl text-sm text-ink-500">
            Ritan Foods (Proprietorship) · GSTIN {c.gstin} · FSSAI Lic. No. {c.fssai}
          </p>
        </div>
      </section>

      <section aria-labelledby="form-title" className="relative overflow-hidden bg-parchment-100 py-24 lg:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          <Marquee speed={35} skew={false}>
            <span className="pr-16 font-display text-[22vw] font-semibold uppercase leading-none tracking-tight text-transparent [-webkit-text-stroke:2px_rgba(30,77,43,0.14)]">Ritan Foods</span>
          </Marquee>
        </div>
        {left && (
          <Parallax speed={0.5} className="pointer-events-none absolute left-[4%] top-[18%] hidden w-[13vw] -rotate-12 lg:block">
            <Image src={left.image} alt="" width={left.imageWidth} height={left.imageHeight} sizes="13vw" className="h-auto w-full drop-shadow-2xl" />
          </Parallax>
        )}
        {right && (
          <Parallax speed={-0.4} className="pointer-events-none absolute bottom-[10%] right-[5%] hidden w-[12vw] rotate-12 lg:block">
            <Image src={right.image} alt="" width={right.imageWidth} height={right.imageHeight} sizes="12vw" className="h-auto w-full drop-shadow-2xl" />
          </Parallax>
        )}
        <div className="container-x relative">
          <div className="mx-auto max-w-xl rounded-[2rem] bg-cream-50 p-7 shadow-[0_40px_80px_-40px_rgba(15,42,23,0.45)] sm:p-10">
            <h2 id="form-title" className="font-display text-display-sm text-forest-900">
              Send us a message
            </h2>
            <p className="mt-2 text-sm text-ink-500">We&apos;ll get back to you as soon as we can.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
