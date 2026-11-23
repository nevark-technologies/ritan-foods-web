import { Intro } from "@/components/layout/Intro";
import { Overlays } from "@/components/layout/Overlays";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StoreHydrator } from "@/components/layout/StoreHydrator";
import { RouteRefresh, SmoothScroll } from "@/components/motion/SmoothScroll";
import { getCatalogLite, getStoreSettings } from "@/lib/data/queries";
import { Suspense } from "react";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, catalog] = await Promise.all([getStoreSettings(), getCatalogLite()]);
  const suggestions = catalog.filter((p) => p.inStock).slice(0, 3);

  return (
    <SmoothScroll>
      <StoreHydrator />
      <Suspense fallback={null}>
        <RouteRefresh />
      </Suspense>
      <Intro />
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-forest-900 px-5 py-3 text-sm font-semibold text-cream-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteHeader announcement={settings.announcement} />
      <main id="main" className="relative">
        {children}
      </main>
      <div className="cv-auto">
        <Suspense fallback={null}>
          <SiteFooter contact={settings.contact} />
        </Suspense>
      </div>
      <Overlays
        freeShippingThreshold={settings.freeShippingThreshold}
        suggestions={suggestions}
        products={catalog}
        phone={settings.contact.phone}
        whatsapp={settings.contact.whatsapp}
      />
      <div className="grain" aria-hidden />
    </SmoothScroll>
  );
}
