import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Alerts";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Alerts | Tatyashree Farmer" },
      { name: "description", content: "Farm alerts and notifications." },
      { property: "og:title", content: "Alerts | Tatyashree Farmer" },
      { property: "og:description", content: "Farm alerts and notifications." },
    ],
  }),
  component: Page,
});
