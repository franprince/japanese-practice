import type { MetadataRoute } from "next"
import { HOME_DESCRIPTION, NOTEBOOK, SITE_NAME } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Japanese Practice App`,
    short_name: SITE_NAME,
    description: HOME_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: NOTEBOOK.paper,
    theme_color: NOTEBOOK.paper,
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
