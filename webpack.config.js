var webpack = require('webpack');
var HtmlPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
  entry: "./app.js",
  output: {
    path: path.join(__dirname, '/public'),
    filename: "bundle.js",
    sourcePrefix: ''
  },
  plugins: [
    new HtmlPlugin({
      template: 'index.html',
      inject: true
    }),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ],
  devServer: {
    contentBase: './public'
  },
  devtool: 'eval',
  module: {
    unknownContextCritical: false,
    loaders: [
      {
        test: /\.css$/,
        loader: "style!css"
      },
      {
        test: /\.(png|gif|jpg|jpeg)$/,
        loader: 'file-loader'
      }
    ]
  },
  resolve: {
    alias: {
      config: path.join(__dirname, 'config', process.env.npm_lifecycle_event === 'start' ? 'development' : 'production')
    }
  }
};
