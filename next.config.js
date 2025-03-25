/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/data-viz',
  assetPrefix: '/data-viz/',
  images: {
    unoptimized: true,
  },
  // 使用靜態輸出
  output: 'export',
}

module.exports = nextConfig 