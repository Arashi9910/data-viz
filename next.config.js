/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/data-viz',
  assetPrefix: '/data-viz/',
}

module.exports = nextConfig 