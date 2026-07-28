import type { NextConfig } from 'next';
import { loadEnvConfig } from '@next/env';

// Load .env files in all environments (dev + prod build)
const projectDir = process.cwd();
loadEnvConfig(projectDir, process.env.NODE_ENV !== 'production');

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Expose critical vars to serverless runtime
  env: {
    DATABASE_URL:              process.env.DATABASE_URL ?? '',
    REACTUS_BASE_URL:          process.env.REACTUS_BASE_URL ?? '',
    HAPPYSEEDS_PROJECT_ID:     process.env.HAPPYSEEDS_PROJECT_ID ?? '',
    BTY_LLM_SERVER_API_KEY:    process.env.BTY_LLM_SERVER_API_KEY ?? '',
    HAPPYSEEDS_KEY:            process.env.HAPPYSEEDS_KEY ?? '',
    HAPPYSEEDS_AVAILABLE_MODELS: process.env.HAPPYSEEDS_AVAILABLE_MODELS ?? '',
    REACTUS_ENV:               process.env.REACTUS_ENV ?? 'prod',
    REACTUS_PROJECT_ID:        process.env.REACTUS_PROJECT_ID ?? '',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.oss-cn-hangzhou.aliyuncs.com' },
      { protocol: 'https', hostname: '**.volces.com' },
      { protocol: 'https', hostname: '**.happyseeds.ai' },
      { protocol: 'https', hostname: '**.s3.us-east-1.amazonaws.com' },
    ],
  },
  serverExternalPackages: ['postgres'],
};

export default nextConfig;
