import { createFileRoute } from "@tanstack/react-router";
import Community from "@/pages/Community";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Farmer Community | Tatyashree Farmer" },
      {
        name: "description",
        content: "Share farming updates and learn from your local farmer community.",
      },
    ],
  }),
  component: Community,
});
