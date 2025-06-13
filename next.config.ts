import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
      };
      
      // Exclude specific packages that are server-only
      config.externals = [
        ...(config.externals || []),
        {
          puppeteer: 'puppeteer',
          'puppeteer-core': 'puppeteer-core',
          '@puppeteer/browsers': '@puppeteer/browsers',
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
