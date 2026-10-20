import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MarketRates";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market Rates | FarmWise" },
      { name: "description", content: "Latest mandi prices for crops." },
      { property: "og:title", content: "Market Rates | FarmWise" },
      { property: "og:description", content: "Latest mandi prices for crops." },
    ],
  }),
  component: Page,
});
