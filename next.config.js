/** @type {import('next').NextConfig} */
const config = require('./lib/config').default;

const nextConfig = {
  images: {
    domains: [
      'rlaxacnkrfohotpyvnam.supabase.co',
      'media.tenor.com',
      'localhost',
      'www.gravatar.com',
      'your-default-ai-avatar.com',
      'randomuser.me'
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: config.app.isProd,
  },
}

module.exports = nextConfig 