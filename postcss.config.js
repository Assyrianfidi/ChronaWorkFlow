// postcss.config.js (project root)
module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-preset-env': {
      stage: 2,
      features: {
        'custom-properties': true,
        // Do not enable experimental color-mod unless you explicitly need it
        // 'color-mod-function': true,
      },
    },
    // add autoprefixer if needed
    autoprefixer: {}
  }
}
