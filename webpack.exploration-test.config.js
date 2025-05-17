/**
 * TerraFlux - Webpack Configuration for Exploration System Test
 */

const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './test-exploration-renderer.ts',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'test-exploration-renderer.bundle.js',
    path: path.resolve(__dirname, './')
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
};
