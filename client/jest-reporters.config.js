// Test reporting configuration for HTML reports
module.exports = {
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'AccuBooks Test Report',
        logoImgPath: undefined,
        inlineSource: false
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ],
    [
      'jest-stare',
      {
        resultDir: './coverage/jest-stare',
        coverageLink: '../lcov-report/index.html',
        resultDir: './coverage'
      }
    ]
  ]
};