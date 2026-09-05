/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    serverExternalPackages: ["bun:sqlite"]
};

export default nextConfig;
