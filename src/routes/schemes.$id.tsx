import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SchemeDetail";

export const Route = createFileRoute("/schemes/$id")({
  head: () => ({
    meta: [
      { title: "Scheme Details | FarmWise" },
      { name: "description", content: "Details and eligibility for a farmer scheme." },
      { property: "og:title", content: "Scheme Details | FarmWise" },
      { property: "og:description", content: "Details and eligibility for a farmer scheme." },
    ],
  }),
  component: Page,
});
