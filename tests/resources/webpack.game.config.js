/**
 * TerraFlux - Webpack Game Configuration
 * 
 * Webpack configuration for bundling the game code.
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  entry: './src/game/index.ts',
  target: 'web',
  
  output: {
    path: path.resolve(__dirname, 'dist', 'game'),
    filename: 'game.bundle.js',
    library: {
      name: 'TerraFluxGame',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this'
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
            plugins: ['@babel/plugin-proposal-class-properties']
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
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]',
        }
      },
      {
        test: /\.(wav|mp3|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/audio/[name][ext]',
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
            drop_console: process.env.NODE_ENV === 'production',
          },
        },
        extractComments: false,
      }),
    ],
  },
  
  // Expose required variables and modules for browser usage
  externals: {
    // Externalize Electron APIs to avoid bundling them
    electron: 'electron'
  },

  // Export important game classes and functions for global access
  // This makes these available as global variables in the browser
  experiments: {
    outputModule: false, // Allow exposing exports to global scope
  }
};

// Path constants for reference (not exported)
const paths = {
  src: path.resolve(__dirname, 'src'),
  game: path.resolve(__dirname, 'src/game'),
  dist: path.resolve(__dirname, 'dist', 'game')
};
