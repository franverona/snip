import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@snip/types'],
  compiler: {
    styledComponents: true,
  },
}

export default nextConfig
