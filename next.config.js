/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained output for Windows desktop (Electron) installer
  output: 'standalone',
  // Ensure Prisma client is generated during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  // Increase timeout for builds
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig

