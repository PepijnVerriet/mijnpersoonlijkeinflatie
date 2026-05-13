/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfjs-dist breaks under Next's server bundler because it dynamically
    // loads a worker chunk that the build skips. Keep it external so the
    // route handler imports it from node_modules at runtime, matching how
    // Vitest runs it.
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

export default nextConfig;
