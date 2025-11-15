/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      resolveAlias: {
        // Resolve problemas de módulos do Turbopack
        canvas: './empty-module.js',
      },
    },
  },
  // Desabilita cache problemático
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
