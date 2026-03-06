/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // You can optionally uncomment the lines below if your app is hosted under a subdirectory like: https://taianh2212.github.io/photobook2/
  basePath: '/photobook2',
  assetPrefix: '/photobook2/',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
