import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CropPlanner";

export const Route = createFileRoute("/crop-planner")({
  head: () => ({
    meta: [
      { title: "Crop Planner | FarmWise" },
      { name: "description", content: "Plan the best crops for your land and season." },
      { property: "og:title", content: "Crop Planner | FarmWise" },
      { property: "og:description", content: "Plan the best crops for your land and season." },
    ],
  }),
  component: Page,
});
