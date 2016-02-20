var webpack = require('webpack');
var HtmlPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
  entry: {
    main: "./app/app.js",
    admin: "./admin/admin.js"
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: "[name].bundle.js",
    chunkFilename: "[id].bundle.js",
    sourcePrefix: ''
  },
  plugins: [
    new HtmlPlugin({
      filename: 'index.html',
      template: 'app/app.html',
      inject: true,
      chunks: ['main']
    }),
    new HtmlPlugin({
      filename: 'admin.html',
      template: 'admin/admin.html',
      inject: true,
      chunks: ['admin']
    }),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new webpack.optimize.UglifyJsPlugin({minimize: true, sourceMap: false, mangle: {
      except: ['$', 'exports', 'require']
    }})
  ],
  devServer: {
    contentBase: './public'
  },
  devtool: 'source-map',
  module: {
    unknownContextCritical: false,
    loaders: [
      {test: /\.css$/, loader: "style!css"},
      {test: /\.(png|gif|jpg|jpeg)$/, loader: 'file-loader'},
      {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file"},
      {test: /\.(woff|woff2)$/, loader: "url?prefix=font/&limit=5000"},
      {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream"},
      {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml"}
    ]
  },
  resolve: {
    alias: {
      config: path.join(__dirname, 'config', process.env.npm_lifecycle_event === 'debug' ? 'development' : 'production')
    }
  }
};
