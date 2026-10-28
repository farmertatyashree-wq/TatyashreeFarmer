import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FarmFinance";

export const Route = createFileRoute("/finance")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Farm Expenses & Profit | Tatyashree Farmer" },
      { name: "description", content: "Track farm expenses, crop sales and profit or loss." },
      { property: "og:title", content: "Farm Expenses & Profit | Tatyashree Farmer" },
      { property: "og:description", content: "Track farm expenses, crop sales and profit or loss." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
