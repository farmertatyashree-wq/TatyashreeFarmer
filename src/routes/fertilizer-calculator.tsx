import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FertilizerCalculator";

export const Route = createFileRoute("/fertilizer-calculator")({
  head: () => ({
    meta: [
      { title: "Fertilizer Calculator | FarmWise" },
      { name: "description", content: "Work out the right fertilizer amounts for your crops." },
      { property: "og:title", content: "Fertilizer Calculator | FarmWise" },
      { property: "og:description", content: "Work out the right fertilizer amounts for your crops." },
    ],
  }),
  component: Page,
});
