import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | FarmWise" },
      { name: "description", content: "Sign in to your FarmWise account." },
      { property: "og:title", content: "Sign in | FarmWise" },
      { property: "og:description", content: "Sign in to your FarmWise account." },
    ],
  }),
  component: Page,
});
