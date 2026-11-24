import { ArrowRight } from "lucide-react";
import { ArchImage } from "@/components/motion/ArchImage";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ButtonLink } from "@/components/ui/Button";
import { RotatingBadge } from "./RotatingBadge";

export function StoryTeaser() {
  return (
    <section id="story" aria-labelledby="story-title" className="relative overflow-hidden bg-cream-50 py-28 lg:py-44">
      <div className="container-x grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow text-leaf-600">Our story</p>
          <SplitReveal as="h2" className="mt-5 font-display text-display-lg text-forest-900">
            Every product has a story of <em className="display-italic text-leaf-500">love.</em>
          </SplitReveal>
          <Reveal className="mt-8 space-y-5 text-body-lg text-ink-700" stagger={0.12}>
            <p id="story-title" data-reveal-item>
              At Ritan Foods, we believe that food is more than just something we eat. It is love served on a plate, memories shared with family, and traditions passed from one
              generation to another.
            </p>
            <p data-reveal-item>
              Inspired by our roots and prepared with care, every product brings together traditional flavours and the goodness of thoughtfully selected ingredients.
            </p>
            <blockquote data-reveal-item className="border-l-2 border-gold-500 pl-5 font-display text-2xl italic leading-snug text-forest-800">
              “Our dream is simple - to bring happiness to every kitchen and make wholesome food a beautiful part of everyday life.”
            </blockquote>
            <div data-reveal-item className="pt-3">
              <ButtonLink href="/our-story" variant="outline">
                Read our story <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        <div className="relative lg:col-span-7">
          <div className="relative mx-auto grid h-[34rem] max-w-[46rem] grid-cols-12 sm:h-[44rem] lg:h-[50rem]">
            <ArchImage
              src="/images/editorial/idlis.webp"
              alt="Soft idlis dusted with idli podi"
              objectPosition="50% 45%"
              className="col-span-7 col-start-1 row-start-1 h-[78%] self-start"
              speed={0.18}
            />
            <ArchImage
              src="/images/editorial/millet-bowl.webp"
              alt="A wooden bowl of golden millet with a wooden spoon"
              objectPosition="50% 50%"
              shape="leaf"
              className="col-span-6 col-start-7 row-start-1 mt-[30%] h-[54%] self-start"
              speed={-0.12}
              sizes="(min-width: 1024px) 24vw, 50vw"
            />
            <ArchImage
              src="/images/editorial/curry-rice.webp"
              alt="A bowl of curry leaf rice with groundnuts"
              objectPosition="50% 50%"
              shape="pill"
              className="col-span-5 col-start-5 row-start-1 mt-[88%] h-[30%] self-start sm:mt-[78%] sm:h-[36%]"
              speed={0.1}
              sizes="(min-width: 1024px) 20vw, 42vw"
            />
            <RotatingBadge className="absolute left-[46%] top-[34%] z-10 size-32 sm:size-40" />
          </div>
        </div>
      </div>
    </section>
  );
}
