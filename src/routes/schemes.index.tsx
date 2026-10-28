import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Schemes";

export const Route = createFileRoute("/schemes/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Government Schemes | Tatyashree Farmer" },
      { name: "description", content: "Browse government schemes for farmers." },
      { property: "og:title", content: "Government Schemes | Tatyashree Farmer" },
      { property: "og:description", content: "Browse government schemes for farmers." },
    ],
  }),
  component: Page,
});
