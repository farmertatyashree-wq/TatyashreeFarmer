import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FertilizerCalculator";

export const Route = createFileRoute("/fertilizer-calculator")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Fertilizer Calculator | Tatyashree Farmer" },
      { name: "description", content: "Work out the right fertilizer amounts for your crops." },
      { property: "og:title", content: "Fertilizer Calculator | Tatyashree Farmer" },
      { property: "og:description", content: "Work out the right fertilizer amounts for your crops." },
    ],
  }),
  component: Page,
});
