const path = require('path');

module.exports = {
  entry: {
    index: './src/main.ts'
  },
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: 'main.js'
  },
  devServer: {
    static: {
      directory: 'docs',
    },
    port: 3000
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: [/node_modules/],
      use: 'ts-loader'
    }]
  }
};
