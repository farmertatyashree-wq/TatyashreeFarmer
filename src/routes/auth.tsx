import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in | Tatyashree Farmer" },
      { name: "description", content: "Sign in to your Tatyashree Farmer account." },
      { property: "og:title", content: "Sign in | Tatyashree Farmer" },
      { property: "og:description", content: "Sign in to your Tatyashree Farmer account." },
    ],
  }),
  component: Page,
});
