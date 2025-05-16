// next.config.js
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove experimental.serverExternalPackages entirely
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Minimal fallback configuration
      config.resolve.fallback = {
        fs: false,
        zlib: false,
        path: false,
      };

      // More aggressive gzip-size ignoring
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /gzip-size/,
          contextRegExp: /./, // Match all contexts
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
