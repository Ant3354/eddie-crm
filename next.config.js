/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Prisma client is generated during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  // Increase timeout for builds
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig

