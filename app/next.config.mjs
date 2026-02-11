/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://api.chronaworkflow.com/api',
    NEXT_PUBLIC_APP_URL: 'https://app.chronaworkflow.com',
  },
};

export default nextConfig;
