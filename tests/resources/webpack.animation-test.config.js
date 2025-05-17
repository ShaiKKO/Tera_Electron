const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './test-animation-renderer.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'test-animation-renderer.bundle.js',
    path: path.resolve(__dirname, './'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './temp-animation-test.html',
      filename: 'temp-animation-test.html'
    }),
  ],
};
