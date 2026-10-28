import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Weather";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Weather | Tatyashree Farmer" },
      { name: "description", content: "Local farm weather forecasts and advice." },
      { property: "og:title", content: "Weather | Tatyashree Farmer" },
      { property: "og:description", content: "Local farm weather forecasts and advice." },
    ],
  }),
  component: Page,
});
