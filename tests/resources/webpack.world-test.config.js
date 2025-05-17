const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './test-world-map-renderer.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Skip type checking
            compilerOptions: {
              noImplicitAny: false,
              strict: false
            }
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'test-world-map-renderer.bundle.js',
    path: path.resolve(__dirname, './'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'TerraFlux - World Map Structure Test',
      template: 'temp-world-test.html'
    }),
  ],
};
