import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MarketRates";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Market Rates | Tatyashree Farmer" },
      { name: "description", content: "Latest mandi prices for crops." },
      { property: "og:title", content: "Market Rates | Tatyashree Farmer" },
      { property: "og:description", content: "Latest mandi prices for crops." },
    ],
  }),
  component: Page,
});
