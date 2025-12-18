/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Output as standalone for better deployment compatibility
  output: 'standalone',
}

module.exports = nextConfig

