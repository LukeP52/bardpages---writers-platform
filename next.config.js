/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable caching in development to prevent stale content
  ...(process.env.NODE_ENV === 'development' && {
    headers: async () => [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ],
  }),
  
  // Add build ID to force cache refresh on deployments
  generateBuildId: async () => {
    return `build-${Date.now()}`
  }
}

module.exports = nextConfig