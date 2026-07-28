import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.oss-cn-hangzhou.aliyuncs.com' },
      { protocol: 'https', hostname: '**.volces.com' },
      { protocol: 'https', hostname: '**.happyseeds.ai' },
    ],
  },
  serverExternalPackages: ['postgres'],
};

export default nextConfig;
