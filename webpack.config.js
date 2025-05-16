const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { DefinePlugin } = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Get environment variables
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/app/index.tsx',
  target: 'web', // Important: use 'web' instead of 'electron-renderer'
  devtool: isDevelopment ? 'inline-source-map' : 'source-map',
  devServer: {
    port: 8080,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, 'build'),
      publicPath: '/',
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
              plugins: [
                isDevelopment && require.resolve('react-refresh/babel'),
              ].filter(Boolean),
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(png|jpe?g|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[hash][ext]'
        }
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      '@app': path.resolve(__dirname, 'src/app/'),
      '@styles': path.resolve(__dirname, 'src/styles/'),
      '@components': path.resolve(__dirname, 'src/app/components/'),
      '@hooks': path.resolve(__dirname, 'src/app/hooks/'),
      '@utils': path.resolve(__dirname, 'src/app/utils/'),
      '@store': path.resolve(__dirname, 'src/store/'),
      '@assets': path.resolve(__dirname, 'src/assets/'),
      '@constants': path.resolve(__dirname, 'src/app/constants/'),
      '@types': path.resolve(__dirname, 'src/app/types/'),
      '@bridge': path.resolve(__dirname, 'src/bridge/'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'js/[name].[contenthash].js',
    publicPath: isDevelopment ? '/' : './',
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: true,
      minify: !isDevelopment,
    }),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.IS_ELECTRON': JSON.stringify(true),
      'window.ENVIRONMENT': JSON.stringify(process.env.NODE_ENV || 'development'),
      'window.APP_VERSION': JSON.stringify(process.env.npm_package_version || '0.1.0'),
    }),
    isDevelopment && new ReactRefreshWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
    }),
    !isDevelopment && new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'src/assets', 
          to: 'assets',
          globOptions: {
            ignore: ['**/*.js', '**/*.ts', '**/*.tsx'],
          },
        },
      ],
    }),
  ].filter(Boolean),
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

            // npm package names are URL-safe, but some servers don't like @ symbols
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
  },
};
