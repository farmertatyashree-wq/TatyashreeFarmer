import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/DiseaseScanner";

export const Route = createFileRoute("/disease-scanner")({
  head: () => ({
    meta: [
      { title: "Disease Scanner | FarmWise" },
      { name: "description", content: "Scan crop photos to spot plant diseases." },
      { property: "og:title", content: "Disease Scanner | FarmWise" },
      { property: "og:description", content: "Scan crop photos to spot plant diseases." },
    ],
  }),
  component: Page,
});
