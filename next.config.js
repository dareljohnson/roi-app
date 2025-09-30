/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  typescript: {
    // During build, ignore TypeScript errors in development
    ignoreBuildErrors: false,
  },
  eslint: {
    // During build, ignore ESLint errors in development
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig