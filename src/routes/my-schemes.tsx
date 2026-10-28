import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MySchemes";

export const Route = createFileRoute("/my-schemes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Schemes | Tatyashree Farmer" },
      { name: "description", content: "Schemes you have saved or applied for." },
      { property: "og:title", content: "My Schemes | Tatyashree Farmer" },
      { property: "og:description", content: "Schemes you have saved or applied for." },
    ],
  }),
  component: Page,
});
