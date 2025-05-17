const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './test-tile-system-renderer.ts',
  output: {
    filename: 'test-tile-system-renderer.bundle.js',
    path: path.resolve(__dirname, './')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'source-map',
  plugins: [
    new webpack.ProvidePlugin({
      PIXI: 'pixi.js'
    })
  ]
};
