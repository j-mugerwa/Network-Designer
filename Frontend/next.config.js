// next.config.js
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export", // Enable static export for Render.com
  images: {
    unoptimized: true, // Disable Next.js image optimization (Render handles this)
  },
  webpack: (config, { isServer }) => {
    // Client-side (browser) polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // Preserve existing fallbacks
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify"),
        os: require.resolve("os-browserify"),
        https: require.resolve("https-browserify"),
        zlib: require.resolve("browserify-zlib"),
        fs: false, // Explicitly disable fs
        net: false, // Disable unused modules
        tls: false,
      };

      // Add global polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        })
      );
    }

    // Skip problematic packages
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^gzip-size$/,
        contextRegExp: /./,
      })
    );

    return config;
  },
};

module.exports = nextConfig;
