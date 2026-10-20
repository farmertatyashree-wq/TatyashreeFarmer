import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Weather";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather | FarmWise" },
      { name: "description", content: "Local farm weather forecasts and advice." },
      { property: "og:title", content: "Weather | FarmWise" },
      { property: "og:description", content: "Local farm weather forecasts and advice." },
    ],
  }),
  component: Page,
});
