import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Livestock";

export const Route = createFileRoute("/livestock")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Livestock Buy & Sell | FarmWise" },
      { name: "description", content: "Farmers buy and sell cows, buffaloes, goats and other animals directly." },
      { property: "og:title", content: "Livestock Buy & Sell | FarmWise" },
      { property: "og:description", content: "Farmers buy and sell cows, buffaloes, goats and other animals directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
