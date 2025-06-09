/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })

    config.module.rules.push({
      test: /\.hbs$/,
      type: 'asset/source',
    })

    // Suprime avisos específicos do Handlebars no lado do servidor
    if (isServer) {
      config.ignoreWarnings = [
        {
          module: /handlebars/,
          message: /require.extensions/,
        },
      ];
    }

    return config
  },
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

export default nextConfig;
