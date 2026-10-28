import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/DiseaseScanner";

export const Route = createFileRoute("/disease-scanner")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Disease Scanner | Tatyashree Farmer" },
      { name: "description", content: "Scan crop photos to spot plant diseases." },
      { property: "og:title", content: "Disease Scanner | Tatyashree Farmer" },
      { property: "og:description", content: "Scan crop photos to spot plant diseases." },
    ],
  }),
  component: Page,
});
