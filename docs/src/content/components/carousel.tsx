import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/registry/bitop/ui/carousel/carousel";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./carousel.tsx?raw";

export function Templates() {
  const templates = ["Marketing site", "Documentation", "Blog", "Dashboard", "E-commerce"];
  const [index, setIndex] = useState(0);
  return (
    <Stack gap={2}>
      <Carousel label="Starter templates" onIndexChange={setIndex}>
        <CarouselContent>
          {templates.map((t) => (
            <CarouselItem key={t}>
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: "10rem",
                  borderRadius: "var(--radius-card)",
                  background: "var(--color-surface-sunken)",
                  fontWeight: 600,
                }}
              >
                {t}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <p style={{ textAlign: "center" }}>
        Template {index + 1} of {templates.length}
      </p>
    </Stack>
  );
}

export function MultiplePerView() {
  const regions = ["Frankfurt", "London", "Virginia", "Oregon", "São Paulo", "Tokyo", "Sydney"];
  return (
    <Carousel label="Regions">
      <CarouselContent slidesPerView={3}>
        {regions.map((r) => (
          <CarouselItem key={r}>
            <div style={{ padding: "1.5rem 1rem", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-ring)", textAlign: "center" }}>{r}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

export function Vertical() {
  const updates = ["Build cache is 40% faster", "New: preview comments", "Edge config is GA"];
  return (
    <Carousel label="Product updates" orientation="vertical" style={{ maxWidth: "20rem", height: "8rem", paddingBlock: "0" }}>
      <CarouselContent>
        {updates.map((u) => (
          <CarouselItem key={u}>
            <div style={{ display: "grid", placeItems: "center", height: "8rem", background: "var(--color-primary-subtle)", color: "var(--color-primary-subtle-text)", borderRadius: "var(--radius-card)" }}>
              {u}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

const doc: ComponentDoc = {
  slug: "carousel",
  title: "Carousel",
  category: "Display",
  description:
    "Slides on a CSS scroll-snap track with previous/next buttons. Swipe, trackpad and wheel scrolling come from the browser; there are no dependencies and no autoplay.",
  imports: `import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel } from "@/components/ui/carousel/carousel";`,
  examples: examples(raw, [
    ["Templates", Templates, { title: "One per view, onIndexChange", wide: true }],
    ["MultiplePerView", MultiplePerView, { title: "Three per view", wide: true }],
    ["Vertical", Vertical, { title: "Vertical", wide: true }],
  ]),
  props: [
    {
      component: "Carousel",
      note: "Also accepts native <section> props.",
      rows: [
        { name: "label", type: "string", required: true, description: "Names the carousel region." },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Track direction. Give vertical carousels a height." },
        { name: "defaultIndex", type: "number", default: "0", description: "First slide shown." },
        { name: "onIndexChange", type: "(index) => void", description: "Current slide changed (buttons, keys, swipe or scroll)." },
        { name: "setApi", type: "(api: CarouselApi) => void", description: "scrollTo, scrollPrev, scrollNext, selectedIndex, slideCount, canScrollPrev, canScrollNext." },
        { name: "slideLabel / announcement", type: "(index, count) => string", description: 'Slide names ("2 of 5") and the live announcement ("Slide 2 of 5").' },
      ],
    },
    { component: "CarouselContent", rows: [{ name: "slidesPerView", type: "number", default: "1", description: "Slides visible at once (gaps included)." }] },
    { component: "CarouselItem", rows: [{ name: "basis", type: "string", description: 'Explicit slide size, e.g. "18rem".' }] },
    { component: "CarouselPrevious / CarouselNext", note: "IconButton props.", rows: [{ name: "label", type: "string", default: '"Previous slide" / "Next slide"', description: "Accessible name." }] },
  ],
  a11y: [
    'The root is a region with aria-roledescription="carousel" named by label; each slide is a group with aria-roledescription="slide" and a “2 of 5” label (WAI-ARIA APG).',
    "Previous/next are buttons with aria-controls on the track. At either end they stay focusable with aria-disabled, so focus is never lost.",
    "With focus inside the carousel, Left/Right (Up/Down when vertical) move between slides; horizontal keys follow the reading direction in RTL.",
    "Navigating with the buttons or keys announces “Slide 2 of 5” in a polite live region.",
    "No autoplay. Smooth scrolling is turned off under prefers-reduced-motion.",
  ],
};

export default doc;
