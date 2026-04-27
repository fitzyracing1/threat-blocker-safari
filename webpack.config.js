const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background/background.ts',
    content: './src/content/content.ts',
    popup: './src/popup/popup.ts',
    settings: './src/settings/settings.ts',
    blocked: './src/blocked/blocked.ts',
    history: './src/history/history.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/settings/settings.html', to: 'settings.html' },
        { from: 'src/blocked/blocked.html', to: 'blocked.html' },
        { from: 'src/history/history.html', to: 'history.html' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'src/settings/settings.css', to: 'settings.css' },
        { from: 'src/blocked/blocked.css', to: 'blocked.css' },
        { from: 'src/history/history.css', to: 'history.css' },
        { from: 'icons', to: 'icons' },
      ],
    }),
  ],
  optimization: {
    minimize: true,
  },
};
