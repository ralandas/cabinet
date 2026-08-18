/** @type {import('next').NextConfig} */
const apiBase = process.env.API_BASE_URL || 'http://178.88.115.213';
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: apiBase + '/api/:path*' },
      { source: '/photos/:path*', destination: apiBase + '/photos/:path*' },
    ];
  },
};

module.exports = nextConfig;
