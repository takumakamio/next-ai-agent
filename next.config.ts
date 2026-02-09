import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig = async (): Promise<NextConfig> => {
  return {
    experimental: {
      serverActions: {
        bodySizeLimit: '100mb',
      },
    },
    images: {
      unoptimized: true,
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
        {
          protocol: 'http',
          hostname: '**',
        },
      ],
    },
  }
}

export default async function config() {
  const config = await nextConfig()
  return withNextIntl(config)
}
