import type { MetadataRoute } from "next"
import { HOME_DESCRIPTION, SITE_NAME } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Japanese Practice App`,
    short_name: SITE_NAME,
    description: HOME_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f0f1a",
    theme_color: "#0f0f1a",
    lang: "en",
    categories: ["education"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
