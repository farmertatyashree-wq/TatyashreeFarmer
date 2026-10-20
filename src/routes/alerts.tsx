import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Alerts";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts | FarmWise" },
      { name: "description", content: "Farm alerts and notifications." },
      { property: "og:title", content: "Alerts | FarmWise" },
      { property: "og:description", content: "Farm alerts and notifications." },
    ],
  }),
  component: Page,
});
