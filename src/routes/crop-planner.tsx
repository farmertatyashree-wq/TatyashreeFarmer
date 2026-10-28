import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CropPlanner";

export const Route = createFileRoute("/crop-planner")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Crop Planner | Tatyashree Farmer" },
      { name: "description", content: "Plan the best crops for your land and season." },
      { property: "og:title", content: "Crop Planner | Tatyashree Farmer" },
      { property: "og:description", content: "Plan the best crops for your land and season." },
    ],
  }),
  component: Page,
});
