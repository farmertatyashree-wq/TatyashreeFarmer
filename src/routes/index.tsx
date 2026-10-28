import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Tatyashree Farmer | Smart Farming" },
      { name: "description", content: "Smart farming assistant: crop planning, disease scanning, weather, market rates and government schemes." },
      { property: "og:title", content: "Tatyashree Farmer | Smart Farming" },
      { property: "og:description", content: "Smart farming assistant: crop planning, disease scanning, weather, market rates and government schemes." },
    ],
  }),
  component: Page,
});
