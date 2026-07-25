import type { MetadataRoute } from "next";

/**
 * Installable to the home screen. For a crisis tool this is not cosmetic: an
 * icon on the home screen is reachable in one tap, where a browser tab is not.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zync — recovery companion",
    short_name: "Zync",
    description:
      "One tap reaches help. A companion for the moment the urge hits, and for the people holding you up.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    categories: ["health", "lifestyle", "medical"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
