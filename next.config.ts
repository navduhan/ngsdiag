import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize native modules for server-side code
  serverExternalPackages: ['ssh2'],
  
  // Empty turbopack config to silence warning
  turbopack: {},
};

export default nextConfig;
