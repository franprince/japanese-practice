/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
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
