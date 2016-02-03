var webpack = require('webpack');
var HtmlPlugin = require('html-webpack-plugin');

module.exports = {
  entry: "./app.js",
  output: {
    path: __dirname + '/public',
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
    contentBase: './public',
  },
  devtool: 'source-map',
  module: {
    unknownContextCritical: false,
    loaders: [
      {test: /\.css$/, loader: "style!css"},
      {
        test: /\.(png|gif|jpg|jpeg)$/,
        loader: 'file-loader'
      }
    ]
  }
};
