/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    // kuromoji (the reader's tokenizer) imports Node's "path" and zlibjs in the browser; swap in small shims there.
    turbopack: {
        resolveAlias: {
            path: { browser: "./src/features/reader/lib/shims/path.ts" },
            "zlibjs/bin/gunzip.min.js": { browser: "./src/features/reader/lib/shims/gunzip.ts" },
        },
    },
    // The reader was renamed to the text analyzer; keep old links and search results working.
    async redirects() {
        return [{ source: "/reader", destination: "/analyzer", permanent: true }]
    },
    async headers() {
        return [
            {
                source: "/wordsets/:asset((?:en|es)-[a-f0-9]{64}\\.json)",
                headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
            {
                source: "/wordsets/manifest.json",
                headers: [{ key: "Cache-Control", value: "no-cache" }],
            },
        ]
    },
};

export default nextConfig;
