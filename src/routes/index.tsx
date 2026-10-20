import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmWise Assistant | FarmWise" },
      { name: "description", content: "Smart farming assistant: crop planning, disease scanning, weather, market rates and government schemes." },
      { property: "og:title", content: "FarmWise Assistant | FarmWise" },
      { property: "og:description", content: "Smart farming assistant: crop planning, disease scanning, weather, market rates and government schemes." },
    ],
  }),
  component: Page,
});
