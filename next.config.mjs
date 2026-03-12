/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Hosted at: https://taianh2212.github.io/photobooth/
  basePath: '/photobooth',
  assetPrefix: '/photobooth/',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
