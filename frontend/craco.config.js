module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        {
          module: /chart\.js/,
          message: /Failed to parse source map/,
        },
      ];
      return webpackConfig;
    },
  },
};