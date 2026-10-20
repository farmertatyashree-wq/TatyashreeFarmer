import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MySchemes";

export const Route = createFileRoute("/my-schemes")({
  head: () => ({
    meta: [
      { title: "My Schemes | FarmWise" },
      { name: "description", content: "Schemes you have saved or applied for." },
      { property: "og:title", content: "My Schemes | FarmWise" },
      { property: "og:description", content: "Schemes you have saved or applied for." },
    ],
  }),
  component: Page,
});
