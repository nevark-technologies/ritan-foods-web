import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import { cacheLife } from "next/cache";
import Link from "next/link";
import type { StoreSettings } from "@/lib/data/types";
import { whatsappLink } from "@/lib/utils";
import { FooterLeaves } from "./FooterLeaves";

const SHOP = [
  { href: "/shop?category=podis", label: "Podis" },
  { href: "/shop?category=rice-mixes", label: "Rice mixes" },
  { href: "/shop?category=health-mixes", label: "Health mixes & malts" },
  { href: "/shop?category=wellness", label: "Wellness" },
  { href: "/shop", label: "Shop all" },
];
const COMPANY = [
  { href: "/our-story", label: "Our story" },
  { href: "/contact", label: "Contact us" },
  { href: "/track-order", label: "Track your order" },
  { href: "/account", label: "My account" },
];
const POLICIES = [
  { href: "/policies/refund-returns", label: "Returns & refunds" },
  { href: "/policies/shipping", label: "Shipping policy" },
  { href: "/policies/privacy", label: "Privacy policy" },
  { href: "/policies/terms", label: "Terms of service" },
];

/** Cached so the footer stays prerenderable while the year still rolls over. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter({ contact }: { contact: StoreSettings["contact"] }) {
  const year = await currentYear();
  return (
    <footer className="relative isolate overflow-hidden bg-forest-900 text-cream-50">
      <div className="container-x relative z-10 pb-[220px] pt-24 lg:pt-32">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Image src="/images/brand/logo.webp" alt="Ritan Foods" width={968} height={714} sizes="160px" className="h-24 w-auto" />
            <p className="mt-6 max-w-sm font-display text-3xl leading-tight text-cream-50">
              Made with tradition, <em className="text-sprout-300">shared with love.</em>
            </p>
            <ul className="mt-8 space-y-3 text-sm text-cream-50/80">
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-3 hover:text-cream-50">
                  <Phone className="size-4 text-sprout-300" /> {contact.phone}
                </a>
              </li>
              <li>
                <a href={whatsappLink(contact.whatsapp, "Hi Ritan Foods!")} target="_blank" rel="noopener" className="inline-flex items-center gap-3 hover:text-cream-50">
                  <MessageCircle className="size-4 text-sprout-300" /> WhatsApp us
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-3 break-all hover:text-cream-50">
                  <Mail className="size-4 shrink-0 text-sprout-300" /> {contact.email}
                </a>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-sprout-300" />
                <span>{contact.address}</span>
              </li>
            </ul>
          </div>
          <FooterCol title="Shop" links={SHOP} />
          <FooterCol title="Ritan Foods" links={COMPANY} />
          <FooterCol title="Policies" links={POLICIES} />
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-cream-50/10 pt-8 text-xs text-cream-50/60 md:flex-row md:items-center md:justify-between">
          <p>© {year} Ritan Foods · Proprietorship · GSTIN {contact.gstin}</p>
          <p>Delivered across India with DTDC &amp; India Post · Secure payments by Razorpay</p>
        </div>
      </div>
      <p aria-hidden className="pointer-events-none absolute inset-x-0 bottom-6 z-0 select-none text-center font-display text-[19vw] italic leading-none text-cream-50/[0.06]">
        Ritan Foods
      </p>
      <FooterLeaves />
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow text-sprout-300">{title}</h2>
      <ul className="mt-6 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-cream-50/85 transition-colors hover:text-cream-50">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
