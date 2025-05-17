const path = require('path');

module.exports = {
  mode: 'development',
  entry: './test-camera-system-renderer.ts',
  devtool: 'source-map',
  output: {
    filename: 'test-camera-system-renderer.bundle.js',
    path: path.resolve(__dirname, ''),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            // This will ignore any errors and emit output regardless
            // Useful while fixing TypeScript errors incrementally
            transpileOnly: true
          }
        },
        exclude: /node_modules/,
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
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@game': path.resolve(__dirname, 'src/game')
    }
  },
};
