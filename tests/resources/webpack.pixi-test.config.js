/**
 * TerraFlux - Webpack Configuration for PixiJS Integration Test
 * 
 * This configuration is specifically for building the PixiJS integration test renderer.
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './test-pixi-integration-renderer.js',
  target: 'web',
  
  output: {
    path: path.resolve(__dirname),
    filename: 'test-pixi-integration-renderer.bundle.js',
    libraryTarget: 'umd'
  },
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@game': path.resolve(__dirname, 'src/game')
    }
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-class-properties']
          }
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]',
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: false, // Keep console logs for debugging
          },
        },
        extractComments: false,
      }),
    ],
  },
  
  externals: {
    electron: 'electron'
  }
};
