import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Schemes";

export const Route = createFileRoute("/schemes/")({
  head: () => ({
    meta: [
      { title: "Government Schemes | FarmWise" },
      { name: "description", content: "Browse government schemes for farmers." },
      { property: "og:title", content: "Government Schemes | FarmWise" },
      { property: "og:description", content: "Browse government schemes for farmers." },
    ],
  }),
  component: Page,
});
