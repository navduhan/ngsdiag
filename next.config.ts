import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize native modules for server-side code
  serverExternalPackages: ['ssh2', 'better-sqlite3'],
  
  // Empty turbopack config to silence warning
  turbopack: {},
  
  // Increase body size limit for large file uploads (NGS files can be several GB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50gb',
    },
  },
};

export default nextConfig;
