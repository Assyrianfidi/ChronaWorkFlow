module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { 
        node: 'current' 
      },
      modules: 'auto',
      useBuiltIns: 'usage',
      corejs: 3,
      shippedProposals: true
    }]
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    ['@babel/plugin-transform-runtime', {
      version: '^7.23.2',
      regenerator: true
    }]
  ],
  sourceMaps: 'inline',
  retainLines: true,
  babelrcRoots: [
    '.',
    './src/*',
    './__tests__/*'
  ]
};
