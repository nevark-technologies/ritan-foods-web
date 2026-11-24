import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { introScript } from "@/components/layout/Intro";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { siteUrl } from "@/lib/site";
import "lenis/dist/lenis.css";
import "./globals.css";

/*
 * Self-hosted, trimmed builds (scripts/fonts/build_fonts.py): Fraunces with
 * opsz/SOFT/WONK pinned and Manrope, each split into a preloaded core (the
 * characters the copy uses), an on-demand "rest" face and a 1 KB rupee face.
 */
const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-normal.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/fraunces-italic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

// Accented letters and rarer marks: only downloaded when a page uses them.
const frauncesRest = localFont({
  src: [
    { path: "./fonts/fraunces-normal-rest.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/fraunces-italic-rest.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-fraunces-rest",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+A1-A8, U+AA-AD, U+AF, U+B1-B6, U+B8-D6, U+D8-FF, U+131, U+152-153, U+2BC, U+2C6, U+2DA, U+2DC, U+300-301, U+303-304, U+308, U+323, U+201A, U+201E, U+2032-2033, U+2039-203A, U+2044, U+20AC, U+2215" }],
});

const frauncesRupee = localFont({
  src: [
    { path: "./fonts/fraunces-normal-rupee.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/fraunces-italic-rupee.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-fraunces-rupee",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+20B9" }],
});

const manrope = localFont({
  src: "./fonts/manrope.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
  adjustFontFallback: "Arial",
});

const manropeRest = localFont({
  src: "./fonts/manrope-rest.woff2",
  weight: "200 800",
  variable: "--font-manrope-rest",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+A1-A8, U+AA-AD, U+AF, U+B1-B6, U+B8-D6, U+D8-FF, U+102, U+131, U+152-153, U+2C6, U+2DA, U+2DC, U+201A, U+201E, U+2039-203A, U+2044, U+20AC, U+2191, U+2193, U+2215" }],
});

const manropeRupee = localFont({
  src: "./fonts/manrope-rupee.woff2",
  weight: "200 800",
  variable: "--font-manrope-rupee",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+20B9" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Ritan Foods - A Taste of Tradition, A Touch of Love",
    template: "%s · Ritan Foods",
  },
  description:
    "Traditional South Indian podis, rice mixes, health mixes and malts from Ritan Foods, Chennai. Made with tradition, shared with love - delivered across India in 3–5 days.",
  applicationName: "Ritan Foods",
  keywords: ["idli podi", "health mix", "sprouted millet", "ABC malt", "Nendran banana malt", "podi online", "Chennai", "traditional food"],
  openGraph: {
    type: "website",
    siteName: "Ritan Foods",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  // Until launch (NEXT_PUBLIC_SITE_LAUNCHED=true) the live site stays out of search results;
  // pages can still be fetched (robots.txt unchanged), e.g. by Razorpay's website check.
  ...(process.env.NEXT_PUBLIC_SITE_LAUNCHED === "true" ? {} : { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: "#0f2a17",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ritan Foods",
  url: siteUrl(),
  logo: `${siteUrl()}/images/brand/logo.png`,
  slogan: "A Taste of Tradition, A Touch of Love",
  email: "ritanfoods.co.in@gmail.com",
  telephone: "+91-7010460911",
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 3/7, Rajajinagar 5th Street, Villivakkam",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    postalCode: "600049",
    addressCountry: "IN",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${frauncesRest.variable} ${frauncesRupee.variable} ${manrope.variable} ${manropeRest.variable} ${manropeRupee.variable}`} suppressHydrationWarning>
      <body>
        {/*
          These inline scripts sit at the top of <body>, not in <head>: Netlify injects a comment
          (with a stray newline) into <head>, and React aborts hydration of the whole page when it
          meets text there while matching a head element. Here they still run before any paint.
        */}
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
