var webpack = require('webpack');
var HtmlPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
  entry: {
    weatherStationVisualize: "./weatherStationVisualize/weatherStationVisualize.js",
    gazeVisualize: './gazeVisualize/heatmapVisualize.js',
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
      template: 'weatherStationVisualize/weatherStationVisualize.html',
      inject: true,
      chunks: ['weatherStationVisualize']
    }),
    new HtmlPlugin({
      filename: 'gazeVisualize.html',
      template: 'gazeVisualize/gazeVisualize.html',
      inject: true,
      chunks: ['gazeVisualize']
    }),
    new HtmlPlugin({
      filename: 'admin.html',
      template: 'admin/admin.html',
      inject: true,
      chunks: ['admin']
    }),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ],
  devServer: {
    contentBase: './public'
  },
  devtool: 'source-map', //'hidden-source-map'
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
