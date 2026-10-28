import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SchemeDetail";

export const Route = createFileRoute("/schemes/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Scheme Details | Tatyashree Farmer" },
      { name: "description", content: "Details and eligibility for a farmer scheme." },
      { property: "og:title", content: "Scheme Details | Tatyashree Farmer" },
      { property: "og:description", content: "Details and eligibility for a farmer scheme." },
    ],
  }),
  component: Page,
});
